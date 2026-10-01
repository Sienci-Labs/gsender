package org.sienci.gsender.s1

import android.app.Activity
import android.os.Bundle
import android.os.SystemClock
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.File
import java.io.IOException

/**
 * Spike S1, step 3: can an installed app run the cross-compiled Node from its
 * nativeLibraryDir (Android 10+ W^X) and serve the pendant to a WebView?
 *
 * Everything is logged under the S1APK tags so apk-smoke.sh can grep logcat:
 *   S1APK        lifecycle + timings (ms since this activity was created)
 *   S1APK-node   Node's stdout/stderr, line by line
 *   S1APK-web    WebView console messages from the pendant
 */
class MainActivity : Activity() {
    private val createdAt = SystemClock.elapsedRealtime()
    private var node: Process? = null
    private lateinit var web: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView, url: String) {
                    log("PAGE_FINISHED url=$url")
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(m: ConsoleMessage): Boolean {
                    Log.i("$TAG-web", "${m.messageLevel()} ${m.message()} (${m.sourceId()}:${m.lineNumber()})")
                    return true
                }
            }
        }
        setContentView(web)
        log("CREATED")
        Thread(::runNode, "s1-node").start()
    }

    override fun onDestroy() {
        node?.destroy()
        super.onDestroy()
    }

    private fun runNode() {
        val payload = File(filesDir, "payload")
        extractPayload(payload)

        val bin = File(applicationInfo.nativeLibraryDir, "libnode_exec.so")
        log("EXEC path=${bin.path} exists=${bin.exists()} canExecute=${bin.canExecute()} bytes=${bin.length()}")

        val home = File(filesDir, "home").apply { mkdirs() }
        val pb = ProcessBuilder(bin.path, "server/server.js", "-p", PORT.toString(), "-H", "127.0.0.1")
            .directory(payload)
            .redirectErrorStream(true)
        pb.environment().apply {
            put("HOME", home.path)
            put("GSENDER_USER_DATA", File(home, "userdata").path)
            put("TMPDIR", cacheDir.path)
            put("LD_LIBRARY_PATH", applicationInfo.nativeLibraryDir)
            put("NODE_COMPILE_CACHE", File(cacheDir, "node-compile-cache").path)
        }

        val p = try {
            pb.start()
        } catch (e: IOException) {
            log("EXEC_FAILED $e")
            return
        }
        node = p
        log("SPAWNED")

        p.inputStream.bufferedReader().forEachLine { line ->
            Log.i("$TAG-node", line)
            if (line.startsWith("S1_READY")) {
                log("READY $line")
                runOnUiThread { web.loadUrl("http://127.0.0.1:$PORT/pendant/") }
            }
        }
        log("NODE_EXITED code=${p.waitFor()}")
    }

    /** Copy assets/payload to filesDir once per installed build. */
    private fun extractPayload(dest: File) {
        val info = packageManager.getPackageInfo(packageName, 0)
        val want = "${info.longVersionCode}-${info.lastUpdateTime}"
        val stamp = File(dest, ".s1-stamp")
        if (stamp.exists() && stamp.readText() == want) {
            log("EXTRACT skipped")
            return
        }
        val t = SystemClock.elapsedRealtime()
        dest.deleteRecursively()
        val counts = longArrayOf(0, 0) // files, bytes
        copyAssets("payload", dest, counts)
        stamp.writeText(want)
        log("EXTRACT ms=${SystemClock.elapsedRealtime() - t} files=${counts[0]} bytes=${counts[1]}")
    }

    private fun copyAssets(path: String, dest: File, counts: LongArray) {
        val children = assets.list(path).orEmpty()
        if (children.isEmpty()) {
            dest.parentFile?.mkdirs()
            assets.open(path).use { input -> dest.outputStream().use { counts[1] += input.copyTo(it, 256 * 1024) } }
            counts[0]++
            return
        }
        dest.mkdirs()
        for (child in children) copyAssets("$path/$child", File(dest, child), counts)
    }

    private fun log(msg: String) = Log.i(TAG, "$msg t=${SystemClock.elapsedRealtime() - createdAt}")

    companion object {
        private const val TAG = "S1APK"
        private const val PORT = 8123
    }
}
