package org.sienci.gsender.pendant

import android.content.Context
import android.os.SystemClock
import android.util.Log
import java.io.File

/**
 * Copies the JS payload (server bundle + pendant UI, packaged as
 * assets/payload by scripts/android/build-payload.js) into app storage, once
 * per installed build. Node can't read files straight out of the APK.
 */
class PayloadInstaller(private val context: Context) {
    val dir: File = File(context.filesDir, "payload")
    private val stamp = File(dir, ".installed-build")

    /** True when the payload on disk doesn't match the installed APK. */
    fun needsInstall(): Boolean = !stamp.exists() || stamp.readText() != buildId()

    /** True when an older payload exists (i.e. this is an app update). */
    fun isUpdate(): Boolean = stamp.exists()

    fun install() {
        val start = SystemClock.elapsedRealtime()
        // Write to a sibling dir and swap, so a half-copied payload is never used.
        val staging = File(context.filesDir, "payload.staging")
        staging.deleteRecursively()
        val counts = longArrayOf(0, 0) // files, bytes
        copyAssets(ASSET_ROOT, staging, counts)
        dir.deleteRecursively()
        check(staging.renameTo(dir)) { "Couldn't move the payload into place" }
        stamp.writeText(buildId())
        Log.i(
            ServerRuntime.TAG,
            "PAYLOAD_INSTALLED ms=${SystemClock.elapsedRealtime() - start} files=${counts[0]} bytes=${counts[1]}",
        )
    }

    private fun buildId(): String {
        val info = context.packageManager.getPackageInfo(context.packageName, 0)
        return "${info.longVersionCode}-${info.lastUpdateTime}"
    }

    private fun copyAssets(path: String, dest: File, counts: LongArray) {
        val children = context.assets.list(path).orEmpty()
        if (children.isEmpty()) {
            dest.parentFile?.mkdirs()
            context.assets.open(path).use { input ->
                dest.outputStream().use { counts[1] += input.copyTo(it, 256 * 1024) }
            }
            counts[0]++
            return
        }
        dest.mkdirs()
        for (child in children) copyAssets("$path/$child", File(dest, child), counts)
    }

    companion object {
        private const val ASSET_ROOT = "payload"
    }
}
