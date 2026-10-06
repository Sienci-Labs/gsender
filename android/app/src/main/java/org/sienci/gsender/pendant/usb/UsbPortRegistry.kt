package org.sienci.gsender.pendant.usb

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet
import org.sienci.gsender.pendant.ServerRuntime

/** Opaque port id handed to the server: usb:<VID hex4>:<PID hex4>:<android deviceName>. */
fun usbPath(device: UsbDevice): String =
    "usb:%04X:%04X:%s".format(device.vendorId, device.productId, device.deviceName)

data class UsbPortInfo(
    val path: String,
    val manufacturer: String?,
    val vendorId: String,
    val productId: String,
    val hasPermission: Boolean,
)

/**
 * Owns USB device enumeration and permission state for the life of the app
 * process, independent of whether the bundled Node server is currently
 * running. Registered once by NodeService.onCreate(); UsbControlChannel and
 * UsbSerialBridgeService read from it and subscribe to attach/detach.
 */
object UsbPortRegistry {
    private const val ACTION_USB_PERMISSION = "org.sienci.gsender.pendant.USB_PERMISSION"

    private lateinit var usbManager: UsbManager
    private lateinit var appContext: Context
    private var receiver: BroadcastReceiver? = null

    // onReceive() below leads into real USB/socket I/O (UsbDataBridge open or
    // close) - registering with no Handler would dispatch it on the main
    // thread and crash with NetworkOnMainThreadException the first time a
    // permission grant or a detach actually does that work (a second run,
    // where permission is already granted, takes a different, already-
    // background-thread path, which is why this only shows up once).
    private var handlerThread: HandlerThread? = null

    private val attachListeners = CopyOnWriteArraySet<(UsbDevice) -> Unit>()
    private val detachListeners = CopyOnWriteArraySet<(UsbDevice) -> Unit>()

    // deviceName -> callbacks waiting on a permission result for that device.
    private val permissionCallbacks = ConcurrentHashMap<String, MutableList<(Boolean) -> Unit>>()

    fun register(context: Context) {
        if (receiver != null) return
        appContext = context.applicationContext
        usbManager = appContext.getSystemService(Context.USB_SERVICE) as UsbManager

        val r = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                val device = intentDevice(intent) ?: return
                when (intent.action) {
                    UsbManager.ACTION_USB_DEVICE_ATTACHED -> {
                        Log.i(ServerRuntime.TAG, "USB_ATTACHED vid=${hex(device.vendorId)} pid=${hex(device.productId)} path=${usbPath(device)}")
                        attachListeners.forEach { it(device) }
                    }
                    UsbManager.ACTION_USB_DEVICE_DETACHED -> {
                        Log.i(ServerRuntime.TAG, "USB_DETACHED path=${usbPath(device)}")
                        detachListeners.forEach { it(device) }
                    }
                    ACTION_USB_PERMISSION -> {
                        val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                        Log.i(ServerRuntime.TAG, "USB_PERMISSION granted=$granted path=${usbPath(device)}")
                        permissionCallbacks.remove(device.deviceName)?.forEach { it(granted) }
                    }
                }
            }
        }
        receiver = r

        val filter = IntentFilter().apply {
            addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
            addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
            addAction(ACTION_USB_PERMISSION)
        }
        val thread = HandlerThread("gsender-usb-events").apply { start() }
        handlerThread = thread
        val handler = Handler(thread.looper)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            appContext.registerReceiver(r, filter, null, handler, Context.RECEIVER_NOT_EXPORTED)
        } else {
            appContext.registerReceiver(r, filter, null, handler)
        }
    }

    fun unregister(context: Context) {
        receiver?.let { runCatching { context.applicationContext.unregisterReceiver(it) } }
        receiver = null
        handlerThread?.quitSafely()
        handlerThread = null
    }

    fun onAttached(listener: (UsbDevice) -> Unit) = attachListeners.add(listener)
    fun onDetached(listener: (UsbDevice) -> Unit) = detachListeners.add(listener)
    fun removeAttached(listener: (UsbDevice) -> Unit) = attachListeners.remove(listener)
    fun removeDetached(listener: (UsbDevice) -> Unit) = detachListeners.remove(listener)

    fun list(): List<UsbPortInfo> = usbManager.deviceList.values.map {
        UsbPortInfo(
            path = usbPath(it),
            manufacturer = it.manufacturerName,
            vendorId = hex(it.vendorId),
            productId = hex(it.productId),
            hasPermission = usbManager.hasPermission(it),
        )
    }

    fun findByPath(path: String): UsbDevice? = usbManager.deviceList.values.find { usbPath(it) == path }

    fun hasPermission(device: UsbDevice): Boolean = usbManager.hasPermission(device)

    fun openConnection(device: UsbDevice) = usbManager.openDevice(device)

    /** Requests permission if not already granted; [callback] always fires exactly once. */
    fun requestPermission(device: UsbDevice, callback: (Boolean) -> Unit) {
        if (usbManager.hasPermission(device)) {
            callback(true)
            return
        }
        permissionCallbacks.getOrPut(device.deviceName) { mutableListOf() }.add(callback)
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0
        val pi = PendingIntent.getBroadcast(
            appContext,
            0,
            Intent(ACTION_USB_PERMISSION).setPackage(appContext.packageName),
            flags,
        )
        usbManager.requestPermission(device, pi)
    }

    private fun hex(id: Int): String = "%04X".format(id)

    private fun intentDevice(intent: Intent): UsbDevice? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
        }
}
