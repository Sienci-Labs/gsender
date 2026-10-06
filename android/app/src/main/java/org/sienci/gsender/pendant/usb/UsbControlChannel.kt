package org.sienci.gsender.pendant.usb

import android.hardware.usb.UsbDevice
import android.util.Log
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.PrintWriter
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import org.json.JSONArray
import org.json.JSONObject
import org.sienci.gsender.pendant.ServerRuntime

/**
 * NDJSON control channel between the bundled Node server and this app's USB
 * layer: one JSON object per line, newline-framed. Node connects out to this
 * loopback socket as a client (the port is passed to it as the
 * GSENDER_USB_CONTROL_PORT env var, see NodeService.startServer()) and keeps
 * one persistent connection for the life of the server process.
 *
 * Requests (Node -> here): {"v":1,"id":N,"op":"list"|"open"|"close",...}
 * Responses (here -> Node): {"v":1,"id":N,"ok":true|false,...}
 * Events (here -> Node, no id): {"v":1,"event":"attached"|"detached","path":...}
 */
class UsbControlChannel(private val bridge: UsbSerialBridgeService) {
    private val server = ServerSocket(0, 1, InetAddress.getLoopbackAddress())
    private val acceptThread = Thread({ acceptLoop() }, "gsender-usb-control-accept")

    @Volatile private var closed = false
    @Volatile private var out: PrintWriter? = null

    val port: Int get() = server.localPort

    private val onAttached: (UsbDevice) -> Unit = { device ->
        emit(JSONObject().put("event", "attached").put("path", usbPath(device)))
    }
    private val onDetached: (UsbDevice) -> Unit = { device ->
        val path = usbPath(device)
        bridge.onDeviceDetached(path)
        emit(JSONObject().put("event", "detached").put("path", path))
    }

    fun start() {
        UsbPortRegistry.onAttached(onAttached)
        UsbPortRegistry.onDetached(onDetached)
        acceptThread.start()
    }

    fun stop() {
        closed = true
        UsbPortRegistry.removeAttached(onAttached)
        UsbPortRegistry.removeDetached(onDetached)
        bridge.closeAll()
        runCatching { server.close() }
    }

    private fun acceptLoop() {
        while (!closed) {
            val socket = try {
                server.accept()
            } catch (e: Exception) {
                if (!closed) Log.w(ServerRuntime.TAG, "USB control accept failed: $e")
                return
            }
            // One client (the Node server) at a time; if it reconnects after a
            // restart, loop back and accept the new connection.
            handleClient(socket)
        }
    }

    private fun handleClient(socket: Socket) {
        socket.tcpNoDelay = true
        val writer = PrintWriter(socket.getOutputStream(), false)
        out = writer
        try {
            val reader = BufferedReader(InputStreamReader(socket.getInputStream()))
            while (!closed) {
                val line = reader.readLine() ?: break
                if (line.isBlank()) continue
                runCatching { handleRequest(JSONObject(line), writer) }
                    .onFailure { Log.w(ServerRuntime.TAG, "Malformed USB control request: $line ($it)") }
            }
        } catch (e: Exception) {
            if (!closed) Log.w(ServerRuntime.TAG, "USB control connection error: $e")
        } finally {
            if (out === writer) out = null
            runCatching { socket.close() }
        }
    }

    private fun handleRequest(req: JSONObject, writer: PrintWriter) {
        val id = req.optInt("id", -1)
        when (req.optString("op")) {
            "list" -> {
                val ports = JSONArray()
                UsbPortRegistry.list().forEach { p ->
                    ports.put(
                        JSONObject()
                            .put("path", p.path)
                            .put("manufacturer", p.manufacturer)
                            .put("vendorId", p.vendorId)
                            .put("productId", p.productId)
                            .put("hasPermission", p.hasPermission),
                    )
                }
                respond(writer, id, JSONObject().put("ok", true).put("ports", ports))
            }
            "open" -> bridge.open(req) { resp -> respond(writer, id, resp) }
            "close" -> bridge.close(req.getString("path")) { resp -> respond(writer, id, resp) }
            else -> respond(writer, id, JSONObject().put("ok", false).put("error", "unknown_op"))
        }
    }

    private fun respond(writer: PrintWriter, id: Int, resp: JSONObject) {
        resp.put("v", 1).put("id", id)
        write(writer, resp)
    }

    private fun emit(obj: JSONObject) {
        out?.let { write(it, obj.put("v", 1)) }
    }

    @Synchronized
    private fun write(writer: PrintWriter, obj: JSONObject) {
        writer.print(obj.toString())
        writer.print("\n")
        writer.flush()
    }
}
