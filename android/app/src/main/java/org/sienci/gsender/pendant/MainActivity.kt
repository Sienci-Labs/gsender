package org.sienci.gsender.pendant

import android.Manifest
import android.app.Activity
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ScrollView
import android.widget.TextView
import android.window.OnBackInvokedDispatcher

/**
 * Hosts the pendant UI. Shows a native load screen while [NodeService] starts
 * the bundled server, then loads http://127.0.0.1:<port>/pendant/ in a WebView
 * and fades the load screen out once the page has loaded. Errors (server
 * failed, page failed) come back to the load screen with Retry and the recent
 * server log.
 *
 * The WebView is only created once the server is ready: building it alongside
 * Node's startup slowed both (docs/android/s1-node-runtime-findings.md).
 */
class MainActivity : Activity() {
    private lateinit var webContainer: FrameLayout
    private lateinit var loading: View
    private lateinit var rocket: RocketLaunchView
    private lateinit var status: TextView
    private lateinit var errorPanel: View
    private lateinit var errorMessage: TextView
    private lateinit var retry: Button
    private lateinit var details: Button
    private lateinit var logScroll: ScrollView
    private lateinit var logView: TextView

    private var web: WebView? = null
    private var loadedPort = -1
    private var pageLoaded = false
    private var pageError: String? = null
    private var launching = false

    /** Until the service reports anything, show "starting" rather than "stopped". */
    private var awaitingServer = true
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val observer: (ServerState) -> Unit = { render(it) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        webContainer = findViewById(R.id.web_container)
        loading = findViewById(R.id.loading)
        rocket = findViewById(R.id.rocket)
        status = findViewById(R.id.status)
        errorPanel = findViewById(R.id.error_panel)
        errorMessage = findViewById(R.id.error_message)
        retry = findViewById(R.id.retry)
        details = findViewById(R.id.details)
        logScroll = findViewById(R.id.log_scroll)
        logView = findViewById(R.id.log)

        // A pendant sits beside the machine; don't let the screen sleep on it.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        applySystemBarInsets(findViewById(R.id.root))
        enterImmersive()
        // chrome://inspect on debug builds.
        WebView.setWebContentsDebuggingEnabled((applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0)

        retry.setOnClickListener { onRetry() }
        details.setOnClickListener { toggleDetails() }
        registerBackHandler()
        requestNotificationPermission()

        NodeService.start(this)
    }

    override fun onStart() {
        super.onStart()
        ServerRuntime.observe(observer)
    }

    override fun onResume() {
        super.onResume()
        enterImmersive()
        startKioskLockIfPermitted()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        // Dialogs, the file picker and the notification shade all bring the
        // bars back; hide them again once we have focus
        if (hasFocus) enterImmersive()
    }

    override fun onStop() {
        ServerRuntime.removeObserver(observer)
        super.onStop()
    }

    override fun onDestroy() {
        filePathCallback?.onReceiveValue(null)
        web?.destroy()
        super.onDestroy()
    }

    /**
     * A USB_DEVICE_ATTACHED intent can bring this singleTask activity back to
     * the foreground while it's already running (manifest intent-filter +
     * device_filter.xml). No action is needed here beyond consuming the
     * intent: NodeService registers a dynamic BroadcastReceiver for the whole
     * process lifetime (UsbPortRegistry), which already sees the same attach
     * broadcast and updates port state independently of this activity.
     */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    // ── State → UI ─────────────────────────────────────────────────────────

    private fun render(state: ServerState) {
        if (state !is ServerState.Stopped) awaitingServer = false
        when (state) {
            ServerState.Stopped -> if (awaitingServer) {
                showProgress(R.string.status_starting, STAGE_WAITING)
            } else {
                dropWebView()
                showMessage(getString(R.string.status_stopped), R.string.action_start, isError = false)
            }
            is ServerState.Installing ->
                showProgress(if (state.isUpdate) R.string.status_installing_update else R.string.status_installing, STAGE_INSTALLING)
            ServerState.Starting -> showProgress(R.string.status_starting, STAGE_STARTING)
            is ServerState.Ready -> {
                if (loadedPort != state.port || web == null) loadPendant(state.port)
                when {
                    pageError != null -> showMessage(getString(R.string.error_page, pageError), R.string.action_retry, isError = true)
                    !pageLoaded -> showProgress(R.string.status_connecting, STAGE_CONNECTING)
                    else -> hideLoadScreen()
                }
            }
            is ServerState.Failed -> {
                showMessage("${getString(R.string.error_title)}\n${state.message}", R.string.action_retry, isError = true)
            }
        }
    }

    /** [stage] is how far up the screen the rocket climbs, 0..1. */
    private fun showProgress(text: Int, stage: Float) {
        showLoadScreen()
        rocket.setEngineOn(true)
        rocket.setStage(stage)
        status.visibility = View.VISIBLE
        status.setText(text)
        errorPanel.visibility = View.GONE
    }

    private fun showMessage(message: String, action: Int, isError: Boolean) {
        showLoadScreen()
        rocket.setEngineOn(false)
        status.visibility = View.GONE
        errorPanel.visibility = View.VISIBLE
        errorMessage.text = message
        errorMessage.setTextColor(getColor(if (isError) R.color.pendant_error else R.color.pendant_text_muted))
        retry.setText(action)
        details.visibility = if (isError) View.VISIBLE else View.GONE
        if (logScroll.visibility == View.VISIBLE) refreshLog()
    }

    private fun showLoadScreen() {
        if (loading.visibility != View.VISIBLE || launching) rocket.reset()
        launching = false
        loading.animate().cancel()
        loading.alpha = 1f
        loading.visibility = View.VISIBLE
    }

    /** The rocket launches out the top; the screen fades over the end of its flight. */
    private fun hideLoadScreen() {
        if (loading.visibility != View.VISIBLE || launching) return
        launching = true
        rocket.launch()
        loading.animate().alpha(0f).setStartDelay(150).setDuration(200).withEndAction {
            loading.visibility = View.GONE
            launching = false
        }
    }

    private fun onRetry() {
        when (val state = ServerRuntime.state) {
            is ServerState.Ready -> {
                // Server is fine; the page failed. Reload it.
                pageError = null
                pageLoaded = false
                showProgress(R.string.status_connecting, STAGE_CONNECTING)
                loadPendant(state.port)
            }
            ServerState.Stopped -> NodeService.start(this)
            else -> NodeService.start(this, restart = true)
        }
    }

    private fun toggleDetails() {
        val show = logScroll.visibility != View.VISIBLE
        logScroll.visibility = if (show) View.VISIBLE else View.GONE
        details.setText(if (show) R.string.action_hide_details else R.string.action_show_details)
        if (show) refreshLog()
    }

    private fun refreshLog() {
        logView.text = ServerRuntime.recentLog()
        logScroll.post { logScroll.fullScroll(View.FOCUS_DOWN) }
    }

    // ── WebView ────────────────────────────────────────────────────────────

    private fun loadPendant(port: Int) {
        dropWebView()
        pageLoaded = false
        pageError = null
        loadedPort = port
        val view = createWebView()
        webContainer.addView(view, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        web = view
        view.loadUrl("http://127.0.0.1:$port/pendant/")
    }

    private fun dropWebView() {
        web?.let {
            webContainer.removeView(it)
            it.destroy()
        }
        web = null
        loadedPort = -1
        pageLoaded = false
    }

    private fun createWebView(): WebView = WebView(this).apply {
        setBackgroundColor(getColor(R.color.pendant_bg))
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        // The pendant lays itself out for the screen; don't let the system
        // font scale reflow it.
        settings.textZoom = 100
        webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
                pageError = null
            }

            override fun onPageFinished(view: WebView, url: String) {
                if (view !== web || pageError != null) return
                pageLoaded = true
                Log.i(ServerRuntime.TAG, "PAGE_LOADED t=${ServerRuntime.sinceProcessStart()}")
                render(ServerRuntime.state)
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (view !== web || !request.isForMainFrame) return
                pageError = error.description?.toString() ?: "error ${error.errorCode}"
                Log.w(ServerRuntime.TAG, "PAGE_ERROR ${error.errorCode} $pageError")
                render(ServerRuntime.state)
            }
        }
        webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(m: ConsoleMessage): Boolean {
                Log.i(WEB_LOG_TAG, "${m.messageLevel()} ${m.message()} (${m.sourceId()}:${m.lineNumber()})")
                return true
            }

            // The pendant falls back to <input type="file"> outside Electron;
            // WebView ignores it unless the app supplies a picker.
            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams,
            ): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                val intent = Intent(Intent.ACTION_OPEN_DOCUMENT)
                    .addCategory(Intent.CATEGORY_OPENABLE)
                    .setType("*/*")
                    .putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
                return try {
                    @Suppress("DEPRECATION")
                    startActivityForResult(intent, REQUEST_FILE)
                    true
                } catch (e: ActivityNotFoundException) {
                    filePathCallback = null
                    false
                }
            }
        }
    }

    @Deprecated("Activity result API needs AndroidX; this app has no dependencies.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != REQUEST_FILE) {
            @Suppress("DEPRECATION")
            super.onActivityResult(requestCode, resultCode, data)
            return
        }
        val callback = filePathCallback ?: return
        filePathCallback = null
        if (resultCode != RESULT_OK || data == null) {
            callback.onReceiveValue(null)
            return
        }
        val clip = data.clipData
        val uris = if (clip != null) {
            Array(clip.itemCount) { clip.getItemAt(it).uri }
        } else {
            listOfNotNull(data.data).toTypedArray()
        }
        callback.onReceiveValue(uris)
    }

    // ── Window ─────────────────────────────────────────────────────────────

    /**
     * Kiosk-style full screen: status and navigation bars hidden, and a swipe
     * from the edge only shows them briefly over the pendant.
     */
    private fun enterImmersive() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.systemBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            // No LAYOUT_STABLE: it would keep reporting the hidden bars as
            // insets, and applySystemBarInsets would pad for them
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                    View.SYSTEM_UI_FLAG_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                )
        }
    }

    /**
     * Full lock-task kiosk (no Home, Recents or notification shade) only when
     * this app is the device owner, which lets it allow-list itself and start
     * silently. Otherwise Android would ask the user to pin the screen every
     * launch, so ordinary installs skip it. See README "Kiosk mode".
     */
    private fun startKioskLockIfPermitted() {
        val dpm = getSystemService(DevicePolicyManager::class.java) ?: return
        if (dpm.isDeviceOwnerApp(packageName)) {
            dpm.setLockTaskPackages(ComponentName(this, KioskAdmin::class.java), arrayOf(packageName))
        }
        if (!dpm.isLockTaskPermitted(packageName)) return
        val am = getSystemService(ActivityManager::class.java)
        if (am?.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_NONE) {
            try {
                startLockTask()
            } catch (e: IllegalStateException) {
                Log.w(ServerRuntime.TAG, "startLockTask failed", e)
            }
        }
    }

    /** targetSdk 35+ is edge-to-edge: keep content clear of system bars, cutouts and the keyboard. */
    private fun applySystemBarInsets(root: View) {
        root.setOnApplyWindowInsetsListener { v, insets ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val types = WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout() or WindowInsets.Type.ime()
                val i = insets.getInsets(types)
                v.setPadding(i.left, i.top, i.right, i.bottom)
            } else {
                @Suppress("DEPRECATION")
                v.setPadding(insets.systemWindowInsetLeft, insets.systemWindowInsetTop, insets.systemWindowInsetRight, insets.systemWindowInsetBottom)
            }
            insets
        }
    }

    /**
     * Back leaves the app without destroying it: the pendant is a single page,
     * and the server keeps running in [NodeService] either way.
     */
    private fun registerBackHandler() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) {
                moveTaskToBack(true)
            }
        }
    }

    @Deprecated("Handled by OnBackInvokedDispatcher on API 33+.")
    override fun onBackPressed() {
        moveTaskToBack(true)
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQUEST_NOTIFICATIONS)
        }
    }

    companion object {
        private const val REQUEST_FILE = 1
        private const val REQUEST_NOTIFICATIONS = 2
        private const val WEB_LOG_TAG = "GSenderPendant-web"

        // Rocket heights for each startup stage (see RocketLaunchView).
        private const val STAGE_WAITING = 0.1f
        private const val STAGE_INSTALLING = 0.3f
        private const val STAGE_STARTING = 0.55f
        private const val STAGE_CONNECTING = 0.8f
    }
}
