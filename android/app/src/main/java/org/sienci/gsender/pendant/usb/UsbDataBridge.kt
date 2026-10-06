package org.sienci.gsender.pendant.usb

import android.hardware.usb.UsbDevice
import android.util.Log
import com.hoho.android.usbserial.driver.UsbSerialDriver
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.util.SerialInputOutputManager
import java.io.IOException
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import org.sienci.gsender.pendant.ServerRuntime

class NoDriverException(message: String) : IOException(message)

private val PARITY_MAP = mapOf(
    "none" to UsbSerialPort.PARITY_NONE,
    "odd" to UsbSerialPort.PARITY_ODD,
    "even" to UsbSerialPort.PARITY_EVEN,
    "mark" to UsbSerialPort.PARITY_MARK,
    "space" to UsbSerialPort.PARITY_SPACE,
)

/**
 * Bridges one open USB serial device to a loopback TCP socket. Kotlin owns
 * the USB connection, including the DTR/RTS lines - classic Grbl on an Uno
 * depends on the DTR reset on open, the same way desktop `serialport`
 * behaves. The server talks to the loopback socket with a plain net.Socket,
 * exactly as it already does for Ethernet (src/server/lib/SerialConnection.js).
 *
 * Reading/writing is byte-transparent: this class has no knowledge of the
 * Grbl/grblHAL protocol running over it.
 */
class UsbDataBridge(
    device: UsbDevice,
    baudRate: Int,
    dataBits: Int,
    stopBits: Int,
    parity: String,
    private val onClosed: (String) -> Unit,
) {
    private val usbPort: UsbSerialPort
    private val serverSocket = ServerSocket(0, 1, InetAddress.getLoopbackAddress())

    @Volatile private var dataSocket: Socket? = null

    @Volatile private var ioManager: SerialInputOutputManager? = null

    @Volatile private var closed = false

    val bridgePort: Int get() = serverSocket.localPort

    init {
        val driver: UsbSerialDriver = UsbSerialProber.getDefaultProber().probeDevice(device)
            ?: throw NoDriverException("No usb-serial-for-android driver for ${device.deviceName}")
        val connection = UsbPortRegistry.openConnection(driver.device)
            ?: throw IOException("UsbManager.openDevice returned null (no permission?)")

        usbPort = driver.ports[0]
        usbPort.open(connection)
        try {
            val stopBitsConst = if (stopBits == 2) UsbSerialPort.STOPBITS_2 else UsbSerialPort.STOPBITS_1
            usbPort.setParameters(baudRate, dataBits, stopBitsConst, PARITY_MAP[parity] ?: UsbSerialPort.PARITY_NONE)
            // Assert immediately on open, before any I/O starts - see class doc.
            // Explicit setDTR/setRTS calls, not Kotlin property syntax: Kotlin's
            // JavaBean property synthesis leaves all-caps accessor names like
            // getDTR/setDTR alone (property "DTR", not "dtr").
            usbPort.setDTR(true)
            usbPort.setRTS(true)
        } catch (e: Exception) {
            runCatching { usbPort.close() }
            throw e
        }

        Thread({ acceptAndRelay() }, "gsender-usb-bridge-${device.deviceName}").start()

        val manager = SerialInputOutputManager(
            usbPort,
            object : SerialInputOutputManager.Listener {
                override fun onNewData(bytes: ByteArray) {
                    try {
                        dataSocket?.getOutputStream()?.write(bytes)
                    } catch (e: IOException) {
                        close("io_error")
                    }
                }

                override fun onRunError(e: Exception) {
                    Log.w(ServerRuntime.TAG, "USB_BRIDGE_IO_ERROR device=${device.deviceName}: $e")
                    close("io_error")
                }
            },
        )
        ioManager = manager
        // SerialInputOutputManager manages its own background thread via
        // start()/stop() in this library version - it isn't a Runnable meant
        // to be submitted to an ExecutorService.
        manager.start()
    }

    /** Accepts exactly one connection from the server's net.Socket, then relays bytes socket -> USB. */
    private fun acceptAndRelay() {
        val socket = try {
            serverSocket.accept()
        } catch (e: IOException) {
            if (!closed) close("io_error")
            return
        }
        socket.tcpNoDelay = true
        dataSocket = socket
        try {
            val input = socket.getInputStream()
            val buf = ByteArray(4096)
            while (!closed) {
                val n = input.read(buf)
                if (n < 0) break
                usbPort.write(buf.copyOf(n), WRITE_TIMEOUT_MS)
            }
        } catch (e: IOException) {
            // Falls through to close() below; this is the normal path for a
            // server-initiated disconnect (socket.destroy() on the Node side).
        }
        if (!closed) close("closed")
    }

    fun close(reason: String) {
        if (closed) return
        closed = true
        runCatching { ioManager?.stop() }
        runCatching { dataSocket?.close() }
        runCatching { serverSocket.close() }
        runCatching { usbPort.close() }
        onClosed(reason)
    }

    companion object {
        private const val WRITE_TIMEOUT_MS = 2000
    }
}
