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
node docs/android/s1/build-server-bundle.js --pendant /tmp/pendant      # → docs/android/s1/out (gitignored)
HOME=/tmp/s1home GSENDER_USER_DATA=/tmp/s1home/userdata \
  node docs/android/s1/out/server/server.js -p 8123 -H 127.0.0.1
```

Point `HOME` at a scratch directory. Otherwise the server reads and writes your real `~/.sender_rc`. On Windows, set `USERPROFILE` too.

## The CI workflow (`android-s1-node.yml`)
It runs on pushes to `features/android` that touch the workflow or this folder.

`workflow_dispatch` (choosing the Node major version, minSdk, NDK, or forcing a rebuild) only appears in the Actions UI once the file exists on the default branch. On this branch, the push defaults apply: Node 24, API 29, NDK r28c.

1. **payload:** builds the pendant, bundles the server, and checks that it starts on the runner's own Node.
2. **node:** cross-compiles Node for `arm64` (the target) and `x86_64` (for the emulator) using Node's own `android_configure.py` with the NDK. It links with `-z max-page-size=16384`, strips the binary, and checks the alignment of each PT_LOAD segment. The binary is cached by Node version, architecture, API level and NDK, so only the first run pays for the build (an hour or more).
3. **smoke:** runs the x86_64 binary on an API 35 emulator twice: with 4 KB pages (`google_apis`) and with 16 KB pages (`google_apis_ps16k`).
4. **report:** a pass/fail table against the exit criteria, written to the run summary.

## What this does *not* cover yet
- **Running from inside an app.** The workflow runs the binary from `/data/local/tmp` as the shell user. Inside an app it must run from `nativeLibraryDir`, packaged as `libnode_exec.so`, because of Android 10+ W^X rules. Testing that needs a minimal APK (the Kotlin shell).
- **Real hardware timing.** Emulator timings come from KVM on x86_64. Measure arm64 startup on a target tablet.
- **USB, serial and flashing.** All stubbed. Those are S3.
