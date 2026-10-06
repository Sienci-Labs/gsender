# gSender Pendant for Android

A native Android shell around the pendant UI (`src/pendant`) and the unchanged gSender server (`src/server`).

The app bundles a Node.js runtime and runs the server **on the device**. The UI loads from that local server in a WebView. This is option E1 from the Android investigation; the feasibility results and lessons are in [`docs/android/s1-node-runtime-findings.md`](../docs/android/s1-node-runtime-findings.md).

```
APK
├─ libnode_exec.so (+ libc++_shared.so)   Node.js, cross-compiled with the NDK  ← android/node, release asset
├─ assets/payload/                        server bundle + pendant UI             ← yarn android:payload
└─ Kotlin shell
   ├─ NodeService      foreground service: installs the payload, runs Node
   │                   (`server.js -p 0 -H 127.0.0.1`), restarts on request
   └─ MainActivity     load screen → WebView at http://127.0.0.1:<port>/pendant/
```

## Building

**Requirements:** a desktop build environment (`yarn install`), JDK 17, and the Android SDK (platform 36).

```sh
yarn android:payload     # dist/android/assets/payload: server bundle + pendant UI
yarn android:runtime     # android/node-runtime/jniLibs: Node.js for arm64 + x86_64 (see below)
cd android && ./gradlew assembleDebug
# → app/build/outputs/apk/debug/app-{arm64-v8a,x86_64}-debug.apk
```

`yarn android:runtime` unpacks prebuilt Node tarballs from `dist/android/node-runtime/`. Cross-compiling Node takes 1–1.5 h, so locally:
1. Download the `android-node-runtime-arm64` and `android-node-runtime-x86_64` artifacts from a recent run of the **Android** workflow.
2. Extract both into `dist/android/node-runtime/`.

Alternatively, run `yarn android:runtime <dir>` with another directory, or build the tarballs on Linux with `android/node/build-node.sh`.

Or run all three with `yarn build:pendant:android`. Android Studio can open `android/` directly once the first two commands have run; the Gradle build stops with instructions if they haven't.

To install on a device:

```sh
adb install -r app/build/outputs/apk/debug/app-arm64-v8a-debug.apk
adb logcat -s GSenderPendant GSenderPendant-node GSenderPendant-web
```

- **Debugging the pendant:** debug builds enable WebView debugging; open `chrome://inspect` on a desktop Chrome with the device connected over USB.
- **Logcat tags:**
  - `GSenderPendant`: app lifecycle (`STATE …`, `PAYLOAD_INSTALLED …`, `PAGE_LOADED …`) and USB events (`USB_ATTACHED`, `USB_DETACHED`, `USB_PERMISSION granted=…`, `USB_BRIDGE_OPEN …`, `USB_BRIDGE_CLOSE … reason=…`)
  - `GSenderPendant-node`: the server's output
  - `GSenderPendant-web`: the pendant's console

## How it works
- **Payload:** `scripts/android/build-payload.js` bundles `src/server-cli.js` and all its npm dependencies into one minified `server.js` (about 4.3 MB). Electron, `serialport`, `usb` and avrgirl are aliased to `src/android/stubs.js`. It builds the pendant with Vite. The layout mirrors `dist/gsender`, so the server's path logic is unchanged. The build fails if any dependency can't be resolved; a dependency left out would otherwise only fail on the device.
- **USB serial:** a Kotlin `usb-serial-for-android` bridge (`android/app/src/main/java/.../pendant/usb/`) owns the USB device and exposes it on a loopback TCP socket; the server talks to it with a plain `net.Socket`, the same way it already does for Ethernet (`src/server/lib/SerialConnection.js`). `NodeService` passes the bridge's control-channel port to Node as `GSENDER_USB_CONTROL_PORT`; `src/server/lib/ports/` picks the Android vs. desktop implementation based on whether that env var is set. See `docs/android/pendant-investigation.md` §3.2 for the design.
- **Startup:**
  - `MainActivity` starts `NodeService`.
  - On the first launch after an install or update, the service copies the payload from the APK into app storage, staged and then swapped.
  - It then starts Node from `nativeLibraryDir`, the only place Android 10+ allows an app to execute files.
  - `src/android/server-entry.js` prints `GSENDER_SERVER_READY port=… ms=…` once the server listens. The server binds to `127.0.0.1` on a port the OS picks.
  - Only then is the WebView created: building it alongside Node's startup slowed both down in S1. The load screen fades out once the pendant page has loaded.
- **State:** the service publishes `ServerState` (Stopped / Installing / Starting / Ready / Failed) through `ServerRuntime`. The activity renders it, including an error screen with Retry and the last 300 lines of server output.
- **Background:** the foreground service (`connectedDevice`) keeps the server, and any job, running while the app is in the background. Back moves the app to the background instead of closing it. The notification's **Stop** action stops the server.
- **Storage:** `HOME` and `GSENDER_USER_DATA` point into app-private storage (rc files, sessions, logs). V8's compile cache (`NODE_COMPILE_CACHE`) lives in the cache dir and cuts later startups.
- **Files:** outside Electron the pendant uses `<input type="file">`. The WebView answers it with the system document picker.

## The Node runtime
Node is cross-compiled once and reused from the GitHub Actions cache, not rebuilt on every build:
- `android/node/runtime.env` pins the Node version, the NDK, minSdk and a revision.
- The **Node runtime** job in `android.yml` runs `android/node/build-node.sh`, which calls `patch-node-source.sh`, for arm64 and x86_64.
- The resulting tarballs are cached under a key that hashes everything in `android/node/`. A cache hit takes about a minute; a miss takes 1–1.5 h per architecture.
- The job uploads the tarballs as artifacts (`android-node-runtime-<arch>`, kept for 14 days). `android/scripts/install-node-runtime.sh` checks their checksums and unpacks them.

When the cache misses:
- **Changes:** any change in `android/node/`, e.g. bumping `NODE_VERSION`, or `RUNTIME_REVISION` to force a rebuild.
- **Eviction:** GitHub evicts caches unused for 7 days. Branch builds then pay the full cross-compile again.
- **Branch scope:** a cache saved on a feature branch is visible only to that branch, though every branch can read caches from the default branch. The first build on `dev` or `master` builds its own.

Moving to prebuilt GitHub Release assets later would remove the eviction rebuilds. `build-node.sh` already writes release-ready tarballs with `.sha256` files.

`patch-node-source.sh` carries two patches that Node's Android cross-compile needs; each one fails loudly if it stops applying. The binary is linked for 16 KB pages, and `build-node.sh` refuses to package it otherwise.

## CI (`.github/workflows/android.yml`)
It runs on the same branches and tags as the desktop CI.
- **Build:** produces debug APKs per ABI (artifact `android-apks`).
- **Emulator check:** installs the x86_64 APK on an API 35 emulator with 16 KB pages, then launches it twice: first launch, then a warm start. It checks:
  - Node runs inside the app sandbox (`untrusted_app`)
  - the API and the pendant answer
  - the foreground-service notification is shown
  - console errors are reported

  Timings and logs are in the run summary and the `android-emulator-results` artifact.

`versionName` is the gSender version, and `versionCode` is the commit count (CI checks out full history).

## Not in this milestone
- **Firmware flashing:** stubbed.
- **Release signing, AAB and Play upload:** debug APKs only.
- **Job-aware power handling:** wake and Wi-Fi locks while a job runs, and stopping the service automatically when idle. Today the server runs until **Stop** in the notification.
- **The native `window.pendantAPI` bridge:** the pendant's quit button and recent-file reload.
