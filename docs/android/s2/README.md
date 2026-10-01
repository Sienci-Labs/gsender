# S2 audit scripts

These scripts back [`../s2-core-boundary-audit.md`](../s2-core-boundary-audit.md). They use the repo's own esbuild (`node_modules/esbuild`) and write nothing outside `out/`, which is gitignored. Run them from any directory after `yarn install`:

```sh
node docs/android/s2/audit.js       # protocol path → out/report.json
node docs/android/s2/pkgaudit.js    # per-package built-ins → out/pkgreport.json (also printed)
node docs/android/s2/pendantapi.js  # server API the pendant reaches (printed)
```

| Script | What it does |
|---|---|
| `audit.js` | Bundles the protocol entry points (controllers, Connection, SerialConnection, Sender, Feeder, JogStreamer, YModemUSB, GrblHALFTP, flashers, CNCEngine) with `platform: 'neutral'`. Records every Node built-in, npm package and `!file-loader!` asset, with the importing file. Also scans the reached files for Node globals and for the members used on each built-in. |
| `pkgaudit.js` | Bundles each third-party package on the protocol path on its own, with both Node and browser `mainFields`, and lists the built-ins it needs transitively. |
| `pendantapi.js` | Bundles `src/pendant/src/entry-pendant.tsx` using the pendant's Vite aliases. Lists the `api.*` calls, literal `/api` paths and `controller.command(...)` names the pendant can reach. |

Notes:
- **Heuristics:** the scans are regex-based. Treat the output as a map to check by hand, not as proof.
- **Package entry points:** `pkgaudit.js` re-exports each package with `export *`. For CommonJS packages with an unusual entry point (for example `@sienci/avrgirl-arduino`) this can under-report. Check those by reading the package.
- **Static reach:** `pendantapi.js` reports what is *statically reachable*. `app/api` is one module, so its literal path list overstates what the pendant calls. The `api.*` call sites are the real usage.
- **Updating:** to audit more code, edit `ENTRIES` in `audit.js` or `PKGS` in `pkgaudit.js`.
