# Spike S2: Core Boundary Audit

**Date:** 2026-09-30
**Question:** How much of the gSender protocol code would have to change for it to run without Node.js? This decides whether option E3 ("portable `gsender-core`" in an embedded JS engine) is realistic for Android, compared with E1 (shipping a Node binary).
**Related:** [`pendant-investigation.md`](./pendant-investigation.md)

## Method
I bundled the protocol path with esbuild (`platform: 'neutral'`, all packages kept external). A resolver plugin recorded every Node built-in, npm package and Electron import, plus the first-party file that imported each one.

- **Protocol entry points:** `GrblHalController`, `GrblController`, `Connection`, `SerialConnection`, `Sender`, `Feeder`, `JogStreamer`, `YModemUSB`, `GrblHALFTP`, `DFUFlasher`, `firmwareflashing`. `CNCEngine` was audited separately.
- **Second pass:** each third-party package on the path was bundled on its own to find the built-ins it needs transitively.
- **Third pass:** the pendant entry (`src/pendant/src/entry-pendant.tsx`) was bundled to find which server endpoints and commands it can reach.
- I then grepped for Node globals (`process`, `Buffer`, `__dirname`, `setImmediate`) and for the members actually used on each built-in.

## Headline
**The protocol code is already almost Node-free.** All 93 reachable first-party files total about 25.4k lines:

| | Files | Lines |
|---|---|---|
| Protocol logic (controllers, line parsers, Sender, Feeder, JogStreamer, YModem, FTP, flashers, ToolChanger, …) | 77 | 19,359 |
| Infrastructure singletons pulled in by the protocol code | 16 | 6,091 |

The 77 protocol files depend on Node in only four ways:

| Dependency | Where | Replacement |
|---|---|---|
| `events` (`EventEmitter`) | 14 files | the `events` npm package (pure JS); no code changes |
| `Buffer` global | `GrblHalController`, `SerialConnection`, `YModemUSB`, `GrblHALFTP`, `DFUFlasher` | the `buffer` npm package; no code changes |
| `net.Socket` | `SerialConnection` only | the transport seam (below) |
| `stream.Readable` | `GrblHALFTP` (`Readable.from`) | goes away with the FTP option chosen (below) |

`process.hrtime` in `lib/plugin-parsers/PluginParserChain.js` is the only other Node global. It can become `performance.now()`.

**Every** use of `fs`, `os`, `path`, `util`, `process.env`, `__dirname`, `electron`, `chalk` and `winston` arrives through six infrastructure modules. The protocol code never uses them directly:

| Module | Pulled in by | What the controllers actually call |
|---|---|---|
| `lib/logger` (winston, chalk, electron, fs) | both controllers and runners | `log.debug/info/warn/error/silly`, about 55 call sites per controller |
| `services/configstore` (fs: atomic JSON write) | both controllers, `EventTrigger` | `config.get("macros")`, 2 call sites per controller |
| `services/monitor` (watch, minimatch, fs) | both controllers | `monitor.readFile`, 1 call site (watch-directory feature, desktop only) |
| `services/pluginregistry` (fs, path, `fs.watch`) | both controllers | `pluginRegistry.getPluginParserSpecs()`, 1 call site |
| `services/taskrunner` (spawn-default-shell, shortid) | both controllers | `taskRunner.run`, 1 call site (shell event triggers, desktop only) |
| `config/settings*` (os, path, fs, electron, `__dirname`) | `logger`, `api.*` | indirect only |

`store` (`src/server/store`) is an in-memory `ImmutableStore` built on `EventEmitter`, so it is already portable. `lib/GcodeToolpath.js` is pure JS. `global.state` in the controllers turned out to be text inside G-code macro strings, not a JavaScript global.

**The UI boundary is narrow.** Controllers reach clients only through `emit()` (`GrblHalController.js:2223`), which loops over a `this.sockets` map and calls `.emit(event, ...args)`. Any object with an `emit` method can stand in for a Socket.IO socket.

## Third-party packages on the protocol path

| Package | Built-ins needed (transitively) | Verdict |
|---|---|---|
| lodash, ensure-array, esprima, escodegen, crc-full, buffer-chunks, nrf-intel-hex | none | portable as-is |
| gcode-parser, gcode-interpreter | events, fs, stream, timers | The functions the controllers call (`parseLine`, `loadFromStringSync`) are pure. `fs` and `stream` are only used by the file and stream helpers. Point `fs` at an empty stub in the core build. |
| @serialport/parser-readline, parser-byte-length | stream (Transform) | Replace with a small line splitter and a byte-mode switch inside the transport. This also replaces YModem's unpipe/re-pipe. |
| basic-ftp | fs, net, tls, path, stream, util | **The hardest package.** Either a `net.Socket`-compatible shim over the native TCP module (FTP needs a second socket for its passive-mode data channel), or a minimal FTP client of about 200 lines: USER/PASS, TYPE I, PASV, STOR. grblHAL needs nothing more. |
| winston, chalk | many | desktop logger only; swap the logger module per platform |
| shortid, spawn-default-shell, watch, minimatch | cluster, crypto, child_process, fs | desktop-only features; stub them |
| serialport | native | the transport seam |
| usb | native | `DFU.js` only calls `findByIds`; see Flashing |
| @sienci/avrgirl-arduino | serialport 10 (nested, native) | can be injected; see Flashing |

## Flashing is more portable than expected
- **DFU (`lib/Firmware/Flashing/DFU.js`):** the only thing it takes from `usb` is `findByIds()`. After `WebUSBDevice.createInstance()`, everything it calls is the standard WebUSB API:
  - `open`, `selectConfiguration`, `claimInterface`, `selectAlternateInterface`
  - `controlTransferIn`/`Out`, `close`
  - the `configurations` descriptor

  Injecting a `findDevice(vid, pid)` function that returns a WebUSB-shaped object is enough to make the existing DFU flasher work on Android, backed by Kotlin `UsbDeviceConnection.controlTransfer`.
- **AVR (avrgirl):** the package is a factory, `AvrgirlArduino(boards, Connection, protocols)`. It already ships a second Connection class (`lib/connection-browser.js`) for Web Serial. A custom Connection over the core transport (open, write, data events, DTR) avoids the nested native `serialport` without forking avrgirl. *Not yet checked:* whether `stk500` itself depends on anything Node-only.
- **UF2:** stays platform-specific: a mounted volume on desktop; PICOBOOT or a Storage Access Framework (SAF) folder on Android.

## What the pendant needs from the server
- **Socket commands:** 46 distinct `controller.command(...)` names (jog, overrides, `gcode:*`, `feeder:*`, toolchange, homing, wizard, `updateEstimateData`, …). All of them are handled inside the controllers, so they come with the core.
- **CNCEngine socket events:**
  - `open`, `close`, `list`, `command`, `write`, `writeln`
  - `addclient`, `newConnection`, `reconnect`, `disconnect`, `hPing`, `listAllIps`
  - `file:fetch`, `file:unload`, `plugin:command`, `plugin:query`, `plugin:parser:unregister`

  `CNCEngine.js` is 1,040 lines. Its Socket.IO wiring, `SerialPort.list()` and `electron` import are the parts that need adapting.
- **REST, as actually called through `api.*`:** about 8 resources:
  - macros, events, alarmList, jobStats, maintenance, preferences, plugins, file

  The handlers are 22–278 lines each and are thin CRUD over `configstore` / `alarmStore` / `jobStore`. `api.plugins.js` uses `child_process` (open folder) and the plugin installer, so on mobile it shrinks to listing and settings.
- **Note:** the pendant reaches 260 first-party files, 220 of them from `src/app/src`. Because `app/api` is a single module, the bundle *statically* references about 40 `/api` paths. Only the `api.*` call sites above are actually used.

## Seams and estimated effort for E3
Most seams can be **build-time module swaps**, done the same way `sidecar-main.js` already stubs `serialport`. A per-platform esbuild alias replaces a module with one that has the same API, so desktop call sites don't change.

| # | Seam | Approach | Desktop change | Estimate |
|---|---|---|---|---|
| 1 | Transport | Split `SerialConnection` behind a `Transport` interface: `open`/`close`/`write`/`writeImmediate`, line events, **raw byte mode** for YModem. Implementations: serialport and `net` (desktop), native bridge (mobile). Drop the `@serialport/parser-*` dependency. | yes (contained) | 2–3 d |
| 2 | Port listing | A `PortProvider` in place of `SerialPort.list()` in `CNCEngine` | yes (small) | 0.5 d |
| 3 | Logger | Alias `lib/logger` to a console or native-log module with the same API | none | 0.5 d |
| 4 | Storage | Alias `services/configstore` (+ `alarmStore`, `jobStore`) to a host-file implementation with the same API | none | 1–2 d |
| 5 | Desktop-only services | Stubs for `monitor`, `taskrunner`, `pluginregistry` (returning parser specs only); a capability flag hides the UI | none, or a flag | 0.5–1 d |
| 6 | Polyfills / stubs | `events`, `buffer`; `fs`/`timers` stubs for gcode-parser/interpreter; `hrtime` → `performance.now` | trivial | 0.5–1 d |
| 7 | FTP | A minimal FTP client on top of the transport, or a `net.Socket` shim for basic-ftp | optional | 2–3 d |
| 8 | Engine adapter | Separate CNCEngine's handlers from Socket.IO. Mobile host: the same event names over a message channel, with a matching client transport in `app/lib/controller`. | yes | 3–5 d |
| 9 | REST surface | A small router shim for the 8 resources (same handlers, adapting Express `req`/`res`) | none | 2–4 d |
| 10 | Flashing injection | `findDevice()` for `DFU.js`; a custom avrgirl Connection | yes (small) | 2–3 d (after v1) |
| 11 | Regression net | Golden-trace harness: recorded controller sessions replayed against the core, on desktop and the core build | new | 3–5 d |

**Total:** about **3–5 weeks** of JS work for a core that can run on Android. That excludes the Kotlin host. Items 1, 2, 8 and 11 are the same seams E1 needs, or are worth doing on desktop anyway, so the E3-only part is roughly 2–3 weeks.

## Open questions not covered by S2
1. **Choice of JS engine host.** The core needs the host to provide `setTimeout`/`setInterval` with millisecond accuracy (JogStreamer ticks every 10 ms), promises/microtasks, and bindings to the native transport.
   - QuickJS (for example quickjs-kt) has no event loop; the host has to supply one.
   - Javet/V8 on Android has a JIT but is a larger binary.
   - Hermes is possible but React Native-oriented.

   This needs a small follow-up spike: run the bundled core in each candidate and measure tick jitter under a streaming load.
2. **The `stk500` packages** inside avrgirl have not yet been checked for Node-only dependencies.
3. **The store's localStorage fallback** in the pendant (`src/app/src/store`) is separate from the server `configstore`. Confirm on mobile which store is authoritative for preferences.

## Conclusion
**E3 is feasible and smaller than feared.** The protocol logic needs no rewrite. It needs a transport interface, about five module swaps at build time, two polyfills and an engine/REST adapter. Main risks:
- FTP (basic-ftp is Node-heavy)
- the engine-host event loop (open question 1)
- the lack of tests, which makes the golden-trace harness (seam 11) a prerequisite rather than optional

**For the decision rule:** if S1 (Node binary) passes cleanly, E1 is still the shorter road to v1. Because seams 1, 2, 8 and 11 are shared, starting with E1 doesn't rule out E3; it pays for about half of it.
