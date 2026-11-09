package org.sienci.gsender.pendant.usb

import android.util.Log
import java.util.concurrent.ConcurrentHashMap
import org.json.JSONObject
import org.sienci.gsender.pendant.ServerRuntime

/**
 * Handles "open"/"close" control-channel requests: resolves the device,
 * requests USB permission if needed (blocking the response until the user
 * answers the system dialog), and hands off to a UsbDataBridge. One bridge
 * per open path. Plain Kotlin class, not a second Android Service - it lives
 * inside NodeService's existing foreground-service process.
 */
class UsbSerialBridgeService {
    private val bridges = ConcurrentHashMap<String, UsbDataBridge>()

    /** [respond] is called exactly once, possibly after the permission dialog is answered. */
    fun open(req: JSONObject, respond: (JSONObject) -> Unit) {
        val path = req.getString("path")
        if (bridges.containsKey(path)) {
            respond(JSONObject().put("ok", false).put("error", "already_open"))
            return
        }
        val device = UsbPortRegistry.findByPath(path)
        if (device == null) {
            respond(JSONObject().put("ok", false).put("error", "device_not_found"))
            return
        }
        UsbPortRegistry.requestPermission(device) { granted ->
            if (!granted) {
                respond(JSONObject().put("ok", false).put("error", "permission_denied"))
                return@requestPermission
            }
            // Re-resolve: the device may have been replugged while the dialog was up.
            val current = UsbPortRegistry.findByPath(path)
            if (current == null) {
                respond(JSONObject().put("ok", false).put("error", "device_not_found"))
                return@requestPermission
            }
            try {
                val bridge = UsbDataBridge(
                    device = current,
                    baudRate = req.optInt("baudRate", 115200),
                    dataBits = req.optInt("dataBits", 8),
                    stopBits = req.optInt("stopBits", 1),
                    parity = req.optString("parity", "none"),
                    onClosed = { reason ->
                        bridges.remove(path)
                        Log.i(ServerRuntime.TAG, "USB_BRIDGE_CLOSE path=$path reason=$reason")
                    },
                )
                bridges[path] = bridge
                Log.i(ServerRuntime.TAG, "USB_BRIDGE_OPEN path=$path bridgePort=${bridge.bridgePort}")
                respond(JSONObject().put("ok", true).put("bridgePort", bridge.bridgePort))
            } catch (e: NoDriverException) {
                respond(JSONObject().put("ok", false).put("error", "driver_unsupported"))
            } catch (e: Exception) {
                Log.w(ServerRuntime.TAG, "USB bridge open failed for $path: $e")
                respond(JSONObject().put("ok", false).put("error", "io_error"))
            }
        }
    }

    fun close(path: String, respond: (JSONObject) -> Unit) {
        bridges.remove(path)?.close("closed")
        respond(JSONObject().put("ok", true))
    }

    /** Called by UsbControlChannel when the registry reports a detach. */
    fun onDeviceDetached(path: String) {
        bridges.remove(path)?.close("detached")
    }

    /** Called when the control channel (and therefore the server) is shutting down. */
    fun closeAll() {
        bridges.keys.toList().forEach { path -> bridges.remove(path)?.close("shutdown") }
    }
}
