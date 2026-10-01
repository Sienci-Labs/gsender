# Spike S1: Node LTS binary on Android

Can we run a **current Node LTS** inside an Android app, instead of nodejs-mobile, which is stuck on Node 18? This spike is option E1 in the Android plan. It is meant for this branch only: delete this folder and `.github/workflows/android-s1-node.yml` once S1 is decided.

## Exit criteria
| Criterion | Pass |
|---|---|
| The arm64 binary is 16 KB page-aligned (Play requirement) | every PT_LOAD segment aligned to 0x4000 or more |
| Server cold start | under 2 s |
| The pendant is served; the API and Socket.IO respond | all 200 |
| APK size | under 120 MB in total |

## Files
| File | Purpose |
|---|---|
| `build-server-bundle.js` | Bundles the stock server (`src/server-cli.js`) into one minified CJS file of about 4.2 MB with every npm dependency inlined. `electron`, `electron-log`, `serialport`, `usb`, avrgirl and `vite` are replaced with `stubs.js`. The output keeps `dist/gsender`'s layout (`server/`, `app/`), so the existing path logic works unchanged. |
| `android-entry.js` | Calls `launchServer()` the same way `bin/gsender` does, then prints `S1_READY ms=… rss=…`. |
| `stubs.js` | Stubs that fail cleanly, in the same spirit as `sidecar-main.js`. |
| `emulator-smoke.sh` | Pushes the binary and payload to an emulator and measures `node -e 0` and server startup (cold first, then warm). Checks `/api/state`, `/pendant/` and the Socket.IO handshake. |

To run locally (any OS, desktop Node 22+):

```sh
npx vite build --config src/pendant/vite.config.ts --outDir /tmp/pendant --emptyOutDir
node docs/android/s1/build-server-bundle.js --out /tmp/s1 --pendant /tmp/pendant
HOME=/tmp/s1home GSENDER_USER_DATA=/tmp/s1home/userdata \
  node /tmp/s1/server/server.js -p 8123 -H 127.0.0.1
```

- **Build outside the repo.** Without `--out`, the bundle lands in `docs/android/s1/out`, inside the repo. Node then quietly resolves any package the bundle failed to include from the repo's `node_modules`, so the test passes locally and fails on the device. (The `bluebird` bug went unnoticed this way.)
- **Fail-fast on missing packages.** The build fails on any unresolved package except the allowlisted optional ones.
- **Point `HOME` at a scratch directory.** Otherwise the server reads and writes your real `~/.sender_rc`. On Windows, set `USERPROFILE` too.
- **Reading `S1_READY`.** `ms` is measured from process start: runtime boot plus parsing the bundle. `wall` is measured from when the entry script started.

## The CI workflow (`android-s1-node.yml`)
It runs on pushes to `features/android` that touch the workflow or this folder.

`workflow_dispatch` (choosing the Node major version, minSdk, NDK, or forcing a rebuild) only appears in the Actions UI once the file exists on the default branch. On this branch, the push defaults apply: Node 24, API 29, NDK r28c.

1. **payload:** builds the pendant, bundles the server, and checks that it starts on the runner's own Node.
2. **node:** cross-compiles Node for `arm64` (the target) and `x86_64` (for the emulator) using Node's own `android_configure.py` with the NDK. It links with `-z max-page-size=16384`, strips the binary, and checks the alignment of each PT_LOAD segment. The binary is cached by Node version, architecture, API level and NDK, so only the first run pays for the build (an hour or more).
3. **smoke:** runs the x86_64 binary on an API 35 emulator twice: with 4 KB pages (`google_apis`) and with 16 KB pages (`google_apis_ps16k`).
4. **report:** a pass/fail table against the exit criteria, written to the run summary.

## Conclusion (2026-10-01)
**E1 is feasible.** A current Node LTS (v24.21.0), cross-compiled with the NDK and shipped as `libnode_exec.so`, runs the unchanged gSender server inside an installed app's sandbox (`untrusted_app`). It works on 4 KB and 16 KB page devices and serves the pendant to a WebView with no console errors.

| S1 criterion | Result |
|---|---|
| arm64 binary is 16 KB-aligned | ✅ |
| Server cold start < 2 s | ✅ 0.85–1.3 s (shell, emulator) |
| Pendant, API and Socket.IO respond | ✅ |
| APK < 120 MB | ✅ **42 MB** arm64 (debug) |
| Runs from `nativeLibraryDir` in an installed app | ✅ |

What E1 costs, and what's still open:
- **Build maintenance.** Two Node build patches so far (zlib CPU detection, V8 trap handler). Node's own Android patch had silently stopped applying. Each Node upgrade needs a CI rebuild (about 1–1.5 h per architecture) and possibly new patches.
- **Startup in the app.** 2.9–3.8 s warm and 4.8–5.6 s first launch to the pendant on the 2-vCPU emulator, about 1 s of it WebView contention. That's acceptable if a foreground service starts Node once per session and the UI shows a splash screen until the server is ready. **Measure on target tablet hardware**; the emulator numbers aren't representative of 8-core devices with a GPU.
- **Not covered by S1:**
  - Running under a foreground service with the screen off for a long job; this is also the defence against the phantom process killer.
  - USB serial (S3).
  - WebView performance on large files (S4).
  - Play review of an app that executes a bundled binary.

## Results so far
| Date | Finding |
|---|---|
| 2026-10-01 | **Node v24.21.0 runs on Android.** x86_64 build, API 35 emulator with 4 KB pages: `node -p` → `v24.21.0 x64 android`. Bare `node -e 0` median is 213 ms (runs: 166, 213, 346, 117, 408). The x86_64 binary passes the 16 KB alignment check. |
| 2026-10-01 | **16 KB pages work, and the S1 startup and HTTP criteria pass on both emulators.** API 35 x86_64; bare = `node -e 0`; ready = until the server is ready.<br>• 4 KB: bare 288 ms, cold ready 1100 ms, warm ready 1747 ms<br>• 16 KB: bare 181 ms, cold ready 1469 ms, warm ready 1474 ms<br>`/api/state`, `/pendant/`, a pendant JS asset and the Socket.IO handshake return 200 on both. Warm starts are no faster than cold ones, so most of the roughly 1.2 s after Node's own startup goes into compiling and initialising the 4.3 MB bundle. That points to V8's compile cache (`NODE_COMPILE_CACHE`) as the next thing to try. These are KVM emulator numbers; tablets will be slower. |
| 2026-10-01 | **Compile cache, local check.** Node only writes its compile cache at a clean exit, which a long-running server or a killed app never reaches. `android-entry.js` therefore calls `module.flushCompileCache()` once the server is ready. With the cache (232 KB) on desktop Windows, Node 22, ready time dropped from about 250 ms to about 183 ms. `emulator-smoke.sh` now measures a second series with `NODE_COMPILE_CACHE` (`cc_first_ready_ms` / `cc_warm_ready_ms`). |
| 2026-10-01 | **The installed app runs Node from `nativeLibraryDir`: E1 is feasible.** Both emulators, x86_64 APK:<br>• the Node process's SELinux label is `untrusted_app` (the normal app sandbox)<br>• `/api/state` and `/pendant/` return 200; the pendant logs no console errors<br>• **arm64 APK: 42 MB** (debug; x86_64 is 44 MB)<br>• arm64 binary is 16 KB-aligned<br>• first-launch payload extraction: 275–721 ms |
| 2026-10-01 | **The compile cache helps.** Shell, warm ready: 443–516 ms with `NODE_COMPILE_CACHE` vs 552–804 ms without; the cache is 272 KB. Single CI-emulator runs vary by ±50%, so compare ranges, not single numbers. |
| 2026-10-01 | **App launch to page loaded is too slow: 2.4–2.9 s warm, 4.4–5.4 s first launch.** In the app, Node is ready 1.7–2.2 s after `onCreate`, against about 0.5 s in the shell test. Suspected cause: `MainActivity` built the WebView (which loads Chromium) before starting Node, and both competed for the emulator's 2 CPUs. Node now starts first, and `apk-smoke.sh` records each phase (`warm_webview_ms`, `warm_spawn_ms`, `warm_node_ms`). Loading the pendant itself adds about 0.7 s. In the real app, a foreground service keeps Node running between Activity launches, so the full cold path happens once per session. |
| 2026-10-01 | **Inside the app, Node itself is about 4× slower.** 16 KB emulator, warm launch, after the start-order fix:<br>• Node spawned at 116 ms and the WebView was built at 885 ms (so the fix worked)<br>• **Node's own time to ready: 1810 ms**, against 443 ms in the shell test with cache and 980 ms without<br>• first and warm app launches are the same (1897 / 1810 ms), so the compile cache looks unused in the app<br>Suspected causes: the compile cache doesn't take effect in the app, and the WebView renderer (software GPU via SwiftShader) competes with Node for the emulator's 2 CPUs. Next run tests both: the app turns on Node's compile-cache debug output (`NODE_DEBUG_NATIVE=COMPILE_CACHE`, plus a `run-as du` of the cache dir), and two extra launches build the WebView only after Node is ready (`deferred_node_ms`). The 4 KB APK job failed on its first launch in this run, after passing in the previous one. |
| 2026-10-01 | **The app's slow start is mostly emulator contention; the compile cache works.** In the app the cache is written (272 KB, the same as the shell test). Node's own time to ready, warm (16 KB / 4 KB):<br>• shell test with cache: 525 / 348 ms<br>• app, WebView deferred until Node is ready: **1671 / 1617 ms**<br>• app, WebView built alongside: 2244 / 2704 ms<br>The WebView competing for the emulator's 2 vCPUs (SwiftShader software GPU) costs 0.6–1.1 s. The rest of the gap to the shell test is most likely system work around the app's own launch, which the shell test doesn't have. App launch to page loaded: 2.9–3.8 s warm, 4.8–5.6 s first launch. No retries were needed; both emulators passed. |
| 2026-10-01 | **Binary size compresses well.** The stripped x86_64 `node` is 96 MB, plus `libc++_shared.so` (8.8 MB). Compressed inside the APK, it comes to the 42 MB total above, so size is no longer a blocker. Further cuts if wanted: `--with-intl=small-icu` (check which `Intl` features the server and pendant use first), and linking libc++ statically. |

## Build patches needed so far
These are part of what E1 would cost us to maintain. Each is applied in the workflow's *Configure and build* step.

| Node | Arch | Symptom | Patch |
|---|---|---|---|
| v24.21.0 | both | host `mksnapshot` link fails with `undefined reference to v8::internal::trap_handler::TryHandleSignal` / `RegisterDefaultTrapHandler` | `deps/v8/src/trap-handler/trap-handler.h`: replace the platform block with `#define V8_TRAP_HANDLER_SUPPORTED false` (nodejs/node#36287). Node ships `android-patches/trap-handler.h.patch` for this, but its context is stale for Node 24's V8, and `android_configure.py patch` ignores the failure. The workflow therefore patches the header directly and fails if the edit didn't apply. This only affects WebAssembly bounds checking, and the handler is already off on Android. |
| v24.21.0 | arm64 | `ld.lld: error: undefined symbol: android_getCpuFeatures` (zlib `cpu_features.c`) | `deps/zlib/zlib.gyp`: define `ARMV8_OS_LINUX` in place of `ARMV8_OS_ANDROID`. zlib then detects CRC32/PMULL through `getauxval(AT_HWCAP)` (bionic, API 18+) and no longer needs the NDK's deprecated cpufeatures library. |

## Step 3: the installed app (`apk/`, `apk-smoke.sh`)
A minimal Kotlin app with no dependencies: one `Activity`, one `WebView`, no AndroidX. It answers the one question the shell-user tests can't: **can an installed app run Node from its `nativeLibraryDir` under Android 10+ W^X rules?**

**What the APK contains** (CI fills `jniLibs/` and `assets/`, both gitignored):
- **Node:** `jniLibs/<abi>/libnode_exec.so`, plus `libc++_shared.so`. Packaged with `useLegacyPackaging = true`, so Android extracts them to `nativeLibraryDir` on install.
- **Payload:** `assets/payload/` holds the server bundle and pendant, minus source maps.

**On launch,** `MainActivity`:
1. Copies the payload to `filesDir` once per install, and times the copy.
2. Starts `libnode_exec.so server/server.js` with `ProcessBuilder`.
3. Logs Node's output under the logcat tag `S1APK-node`.
4. Loads `http://127.0.0.1:8123/pendant/` when `S1_READY` appears.

The app sets `HOME`, `GSENDER_USER_DATA`, `TMPDIR` and `NODE_COMPILE_CACHE` to app-private directories. Cleartext HTTP is allowed only to `127.0.0.1` and `localhost`.

**`apk-smoke.sh`** installs the APK and launches it three times: first launch (with extraction), then two warm launches. It records:
- the extraction time, the time until Node is ready, and the time until the page loads
- the Node process's SELinux label, which must be `untrusted_app` (the normal app sandbox)
- HTTP checks through `adb forward`
- the pendant's console errors

**Building locally** needs the Android SDK, JDK 17 and Gradle 8.11.1. Fill `jniLibs/` and `assets/payload/` the way the workflow's *Stage native libs and payload* step does, then run `gradle -p docs/android/s1/apk assembleDebug`.

**Known risk this doesn't test yet:**
- **Android 12+ phantom process killer.** Android limits child processes across all apps (32 by default), and kills ones that use excessive CPU while their app is in the background. A foreground service keeps the app out of the background state. Before E1 can be trusted for a long job, the real shell needs a soak test with the service and the screen off.

## What this does *not* cover yet
- **Foreground service, wake locks and long jobs.** The APK runs Node from an `Activity`. The real shell would own it from a `connectedDevice` foreground service (see the phantom process note above).
- **Real hardware timing.** Emulator timings come from KVM on x86_64. Measure arm64 startup on a target tablet.
- **USB, serial and flashing.** All stubbed. Those are S3.
