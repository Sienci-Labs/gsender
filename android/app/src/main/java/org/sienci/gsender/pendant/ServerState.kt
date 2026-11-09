package org.sienci.gsender.pendant

import android.os.Handler
import android.os.Looper
import android.os.Process
import android.os.SystemClock
import android.util.Log
import java.util.concurrent.CopyOnWriteArraySet

/** Lifecycle of the bundled gSender server, published by [NodeService]. */
sealed interface ServerState {
    data object Stopped : ServerState

    /** Copying the JS payload out of the APK (first launch after install/update). */
    data class Installing(val isUpdate: Boolean) : ServerState

    /** Node is running; waiting for the server to report it's listening. */
    data object Starting : ServerState

    data class Ready(val port: Int, val startupMs: Long) : ServerState

    data class Failed(val message: String) : ServerState
}

/**
 * In-process state shared by [NodeService] (writer) and [MainActivity]
 * (observer), plus a ring buffer of recent server output for the error screen.
 * Observers are always called on the main thread.
 */
object ServerRuntime {
    const val TAG = "GSenderPendant"
    private const val LOG_LINES = 300

    @Volatile
    var state: ServerState = ServerState.Stopped
        private set

    private val main = Handler(Looper.getMainLooper())
    private val observers = CopyOnWriteArraySet<(ServerState) -> Unit>()
    private val log = ArrayDeque<String>()

    fun observe(observer: (ServerState) -> Unit) {
        observers.add(observer)
        main.post { if (observer in observers) observer(state) }
    }

    fun removeObserver(observer: (ServerState) -> Unit) {
        observers.remove(observer)
    }

    internal fun update(next: ServerState) {
        state = next
        // Machine-readable line for android/scripts/emulator-smoke.sh.
        Log.i(TAG, "STATE ${describe(next)} t=${sinceProcessStart()}")
        main.post { observers.forEach { it(next) } }
    }

    internal fun appendLog(line: String) {
        synchronized(log) {
            log.addLast(line)
            while (log.size > LOG_LINES) log.removeFirst()
        }
    }

    internal fun clearLog() = synchronized(log) { log.clear() }

    fun recentLog(): String = synchronized(log) { log.joinToString("\n") }

    /** Milliseconds since this app process started (for startup timings). */
    fun sinceProcessStart(): Long = SystemClock.elapsedRealtime() - Process.getStartElapsedRealtime()

    private fun describe(s: ServerState): String = when (s) {
        ServerState.Stopped -> "Stopped"
        is ServerState.Installing -> "Installing update=${s.isUpdate}"
        ServerState.Starting -> "Starting"
        is ServerState.Ready -> "Ready port=${s.port} node_ms=${s.startupMs}"
        is ServerState.Failed -> "Failed ${s.message}"
    }
}
