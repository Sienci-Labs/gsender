package org.sienci.gsender.pendant

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.util.Log
import java.net.URLDecoder

/**
 * Advertises the Remote File Receive listener as _gsender-pendant._tcp so
 * desktops can find this tablet without typing its IP.
 *
 * Node can't reliably do mDNS on Android (it would need a MulticastLock and
 * would compete with the system responder), so the server prints
 * `GSENDER_PENDANT_ADVERTISE port=… id=… name=…` / `GSENDER_PENDANT_ADVERTISE off`
 * (src/server/services/remoteFileReceive/advertiser.js) and NodeService feeds
 * those lines here. NsdManager handles multicast itself.
 */
class PendantAdvertiser(context: Context) {
    private val nsd = context.getSystemService(NsdManager::class.java)

    @Volatile
    private var listener: NsdManager.RegistrationListener? = null

    /** Returns true if [line] was an advertise marker. */
    fun handle(line: String): Boolean {
        if (!line.startsWith(MARKER)) return false
        val args = line.removePrefix(MARKER).trim()
        if (args == "off") {
            unregister()
            return true
        }
        val port = Regex("""port=(\d+)""").find(args)?.groupValues?.get(1)?.toIntOrNull()
        val id = Regex("""id=(\S+)""").find(args)?.groupValues?.get(1)
        val name = Regex("""name=(\S+)""").find(args)?.groupValues?.get(1)
            ?.let { URLDecoder.decode(it, "UTF-8") }
        if (port != null && id != null) register(port, id, name ?: "gSender Pendant")
        return true
    }

    @Synchronized
    private fun register(port: Int, id: String, name: String) {
        unregister()
        val info = NsdServiceInfo().apply {
            serviceName = name
            serviceType = SERVICE_TYPE
            setPort(port)
            setAttribute("id", id)
            setAttribute("v", "1")
        }
        val l = object : NsdManager.RegistrationListener {
            override fun onServiceRegistered(info: NsdServiceInfo) {
                Log.i(TAG, "advertising ${info.serviceName} on port $port")
            }

            override fun onRegistrationFailed(info: NsdServiceInfo, errorCode: Int) {
                Log.w(TAG, "NSD registration failed: $errorCode")
            }

            override fun onServiceUnregistered(info: NsdServiceInfo) {}

            override fun onUnregistrationFailed(info: NsdServiceInfo, errorCode: Int) {
                Log.w(TAG, "NSD unregistration failed: $errorCode")
            }
        }
        listener = l
        nsd.registerService(info, NsdManager.PROTOCOL_DNS_SD, l)
    }

    @Synchronized
    fun unregister() {
        val l = listener ?: return
        listener = null
        try {
            nsd.unregisterService(l)
        } catch (e: IllegalArgumentException) {
            // Registration never completed - nothing to undo.
        }
    }

    companion object {
        private const val TAG = "GSenderPendant-nsd"
        private const val MARKER = "GSENDER_PENDANT_ADVERTISE"
        private const val SERVICE_TYPE = "_gsender-pendant._tcp"
    }
}
