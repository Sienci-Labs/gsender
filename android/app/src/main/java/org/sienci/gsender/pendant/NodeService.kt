package org.sienci.gsender.pendant

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.drawable.Icon
import android.os.Build
import android.os.IBinder
import android.util.Log
import java.io.File
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread
import org.sienci.gsender.pendant.usb.UsbControlChannel
import org.sienci.gsender.pendant.usb.UsbPortRegistry
import org.sienci.gsender.pendant.usb.UsbSerialBridgeService

/**
 * Foreground service that owns the bundled Node.js process running the gSender
 * server. Being a foreground service keeps the server (and a running job)
 * alive while the app is in the background, and keeps Android's phantom
 * process killer from treating Node as an idle background child.
 *
 * Start/stop/restart run on one control thread, so they never race each other
 * or block the main thread. Node's output is read on its own thread.
 */
class NodeService : Service() {
    private val control: ExecutorService = Executors.newSingleThreadExecutor()

    @Volatile
    private var process: Process? = null

    @Volatile
    private var stopping = false

    @Volatile
    private var usbControlChannel: UsbControlChannel? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        val channel = NotificationChannel(CHANNEL_ID, getString(R.string.notification_channel), NotificationManager.IMPORTANCE_LOW)
        channel.description = getString(R.string.notification_channel_description)
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        // Lives for the whole process, independent of whether Node is running,
        // so a device plugged in before the server starts is already known.
        UsbPortRegistry.register(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Every startForegroundService() must be answered with startForeground().
        try {
            startForeground(NOTIFICATION_ID, notification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
        } catch (e: Exception) {
            Log.e(ServerRuntime.TAG, "startForeground failed", e)
        }
        when (intent?.action) {
            ACTION_STOP -> control.execute {
                stopServer()
                ServerRuntime.update(ServerState.Stopped)
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
            ACTION_RESTART -> control.execute {
                stopServer()
                startServer()
            }
            else -> control.execute {
                if (process?.isAlive != true) startServer()
            }
        }
        // Not sticky: if Android kills the app, the user restarts it; a job
        // can't be resumed without them anyway.
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        control.execute { stopServer() }
        control.shutdown()
        UsbPortRegistry.unregister(this)
        super.onDestroy()
    }

    /** Runs on the control thread. */
    private fun startServer() {
        stopping = false
        ServerRuntime.clearLog()
        try {
            val payload = PayloadInstaller(this)
            if (payload.needsInstall()) {
                ServerRuntime.update(ServerState.Installing(payload.isUpdate()))
                payload.install()
            }
            ServerRuntime.update(ServerState.Starting)
            refreshNotification()

            val node = File(applicationInfo.nativeLibraryDir, NODE_EXECUTABLE)
            val home = File(filesDir, "home").apply { mkdirs() }

            // Bound before Node starts, so the port handed to it is already
            // listening; torn down in stopServer() alongside the process.
            val usbChannel = UsbControlChannel(UsbSerialBridgeService())
            usbChannel.start()
            usbControlChannel = usbChannel

            val builder = ProcessBuilder(node.path, "server/server.js", "-p", "0", "-H", "127.0.0.1")
                .directory(payload.dir)
                .redirectErrorStream(true)
            builder.environment().apply {
                // rc files, sessions, plugins and logs all go to app-private storage.
                put("HOME", home.path)
                put("GSENDER_USER_DATA", File(home, "userdata").path)
                put("TMPDIR", cacheDir.path)
                put("LD_LIBRARY_PATH", applicationInfo.nativeLibraryDir)
                put("NODE_COMPILE_CACHE", File(cacheDir, "node-compile-cache").path)
                put("GSENDER_USB_CONTROL_PORT", usbChannel.port.toString())
            }
            val started = builder.start()
            process = started
            thread(name = "gsender-server-output") { pumpOutput(started) }
        } catch (e: Exception) {
            Log.e(ServerRuntime.TAG, "server start failed", e)
            ServerRuntime.appendLog(e.stackTraceToString())
            ServerRuntime.update(ServerState.Failed(e.message ?: e.toString()))
            refreshNotification()
            // The failure may have happened after the USB channel bound but
            // before the process started (e.g. node.path missing); stopServer()
            // only runs if process != null, so close it here too.
            usbControlChannel?.stop()
            usbControlChannel = null
        }
    }

    /** Forwards Node's output to logcat and the in-app log; reports readiness and exit. */
    private fun pumpOutput(p: Process) {
        try {
            p.inputStream.bufferedReader().forEachLine { line ->
                Log.i(NODE_LOG_TAG, line)
                ServerRuntime.appendLog(line)
                if (line.startsWith(READY_MARKER)) {
                    val port = Regex("""port=(\d+)""").find(line)?.groupValues?.get(1)?.toInt()
                    val ms = Regex("""ms=(\d+)""").find(line)?.groupValues?.get(1)?.toLong() ?: -1
                    if (port != null) {
                        ServerRuntime.update(ServerState.Ready(port, ms))
                    } else {
                        ServerRuntime.update(ServerState.Failed("The server started but didn't report its port."))
                    }
                    refreshNotification()
                }
            }
        } catch (e: Exception) {
            if (!stopping) ServerRuntime.appendLog("output: $e")
        }
        val code = p.waitFor()
        if (!stopping && process === p) {
            ServerRuntime.update(ServerState.Failed("The server stopped unexpectedly (exit code $code)."))
            refreshNotification()
        }
    }

    /** Runs on the control thread. */
    private fun stopServer() {
        usbControlChannel?.stop()
        usbControlChannel = null
        val p = process ?: return
        stopping = true
        p.destroy() // SIGTERM: let the server close the controller connection
        if (!p.waitFor(3, TimeUnit.SECONDS)) p.destroyForcibly()
        process = null
    }

    private fun refreshNotification() {
        getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification())
    }

    private fun notification(): Notification {
        val text = when (ServerRuntime.state) {
            is ServerState.Ready -> R.string.notification_running
            is ServerState.Failed -> R.string.notification_failed
            else -> R.string.notification_starting
        }
        val open = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE,
        )
        val stop = PendingIntent.getService(
            this, 1,
            Intent(this, NodeService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE,
        )
        val builder = Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(text))
            .setContentIntent(open)
            .setOngoing(true)
            .setShowWhen(false)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)
        }
        return builder
            .addAction(
                Notification.Action.Builder(
                    Icon.createWithResource(this, R.drawable.ic_notification),
                    getString(R.string.notification_stop),
                    stop,
                ).build(),
            )
            .build()
    }

    companion object {
        const val ACTION_START = "org.sienci.gsender.pendant.START"
        const val ACTION_RESTART = "org.sienci.gsender.pendant.RESTART"
        const val ACTION_STOP = "org.sienci.gsender.pendant.STOP"

        private const val CHANNEL_ID = "server"
        private const val NOTIFICATION_ID = 1
        private const val NODE_EXECUTABLE = "libnode_exec.so"
        private const val NODE_LOG_TAG = "GSenderPendant-node"

        /** Printed by src/android/server-entry.js once the server is listening. */
        private const val READY_MARKER = "GSENDER_SERVER_READY"

        fun start(context: Context, restart: Boolean = false) {
            val intent = Intent(context, NodeService::class.java)
                .setAction(if (restart) ACTION_RESTART else ACTION_START)
            context.startForegroundService(intent)
        }
    }
}
