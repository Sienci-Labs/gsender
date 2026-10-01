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

## Results so far
| Date | Finding |
|---|---|
| 2026-10-01 | **Node v24.21.0 runs on Android.** x86_64 build, API 35 emulator with 4 KB pages: `node -p` → `v24.21.0 x64 android`. Bare `node -e 0` median is 213 ms (runs: 166, 213, 346, 117, 408). The x86_64 binary passes the 16 KB alignment check. |
| 2026-10-01 | **Size is the next concern.** The stripped x86_64 `node` is 96 MB, and it needs `libc++_shared.so` (8.8 MB) alongside it. Options to try: `--with-intl=small-icu` (full ICU is roughly 25–30 MB of that), and linking libc++ statically. First check which `Intl` features the server and pendant use. |

## Build patches needed so far
These are part of what E1 would cost us to maintain. Each is applied in the workflow's *Configure and build* step.

| Node | Arch | Symptom | Patch |
|---|---|---|---|
| v24.21.0 | both | host `mksnapshot` link fails with `undefined reference to v8::internal::trap_handler::TryHandleSignal` / `RegisterDefaultTrapHandler` | `deps/v8/src/trap-handler/trap-handler.h`: replace the platform block with `#define V8_TRAP_HANDLER_SUPPORTED false` (nodejs/node#36287). Node ships `android-patches/trap-handler.h.patch` for this, but its context is stale for Node 24's V8, and `android_configure.py patch` ignores the failure. The workflow therefore patches the header directly and fails if the edit didn't apply. This only affects WebAssembly bounds checking, and the handler is already off on Android. |
| v24.21.0 | arm64 | `ld.lld: error: undefined symbol: android_getCpuFeatures` (zlib `cpu_features.c`) | `deps/zlib/zlib.gyp`: define `ARMV8_OS_LINUX` in place of `ARMV8_OS_ANDROID`. zlib then detects CRC32/PMULL through `getauxval(AT_HWCAP)` (bionic, API 18+) and no longer needs the NDK's deprecated cpufeatures library. |

## What this does *not* cover yet
- **Running from inside an app.** The workflow runs the binary from `/data/local/tmp` as the shell user. Inside an app it must run from `nativeLibraryDir`, packaged as `libnode_exec.so`, because of Android 10+ W^X rules. Testing that needs a minimal APK (the Kotlin shell).
- **Real hardware timing.** Emulator timings come from KVM on x86_64. Measure arm64 startup on a target tablet.
- **USB, serial and flashing.** All stubbed. Those are S3.
