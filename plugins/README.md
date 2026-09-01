# gSender Plugins (examples)

Copy a plugin folder into your gSender plugins directory (path varies by OS; check **Tools → Plugins** in the app for the exact location):

| OS | Default plugins directory |
|----|---------------------------|
| macOS | `~/Library/Application Support/<gSender app name>/plugins/` |
| Windows | `%APPDATA%\<gSender app name>\plugins\` |
| Linux | `~/.config/<gSender app name>/plugins/` |

The app name matches `package.json` `name` (currently `gSender`).

Then restart gSender.

## Included examples

| Folder | Stack | What it demonstrates |
|--------|-------|----------------------|
| `example-hello/` | Plain JS + Vite | Bridge client — `gsender`, `subscribeWorkspaceState`, `subscribeSelector` |
| `react-ts-app/` | React + TypeScript + Vite | React hooks — `useWorkspaceState`, `useTypedSelector` |
| `example-viewer/` | Plain JS + Vite | Embedded G-code preview — `GCodeViewer`, `gsender.gcode.loadToVisualizer` |
| `basic-cam/` | React + TypeScript + Vite + Tailwind | Full reference CAM plugin — combines all SDK entry points |
| `corner-finder/` | React + TypeScript + Vite | Host visualizer bridge — `gsender.viewer.*` (picking, camera, overlay markers) + `machine.setBusy` |
| `storage-test/` | Plain JS + Vite | Namespaced plugin storage — buttons for every `storage.*` method (get/set/delete/getAll/setAll/clear), for QA |
| `parser-demo/` | Plain JS + Vite | Firmware response parsers — manifest line/block parsers, runtime `registerParser`, `onLine`, `machine.query`, plus a command sender to drive them |

Each folder must contain `gsender-plugin.json` and a `ui/` directory with the built SPA entry file.

### Manifest fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Unique identifier, reverse-DNS style (e.g. `com.sienci.basic-cam`). Plugins with a `com.sienci.` id are shown as "Sienci official" on the Tools page; anything else is shown as "Community". |
| `name` | yes | Display name. |
| `version` | yes | Semver string. |
| `description` | no | Short blurb (~1 sentence) shown on the plugin's Tools-page card. Falls back to no blurb if omitted. |
| `engine` | no | Compatible gSender version range (e.g. `>=1.6.0`). |
| `ui.entry` | yes | Path to the built SPA entry file, relative to the plugin folder. |
| `ui.contributions` | no | Array of `{ slot, route, label }` describing where the plugin mounts (e.g. `tools-page`). |
| `capabilities` | no | Object of bridge permissions the plugin requests (examples and explanation in the next section). |
| `parsers` | no | Array of firmware response parser specs. Matched server-side and live from the moment the port opens — independent of whether the plugin's UI is mounted. See the [plugin parsers guide](../docs/plugin-parsers.md). |

### Manifest capabilities

The bridge denies everything a plugin was not granted. Grants live in the
manifest's `capabilities` object, which is written during import after the user
authorizes the scanned permissions, or hand-authored for gsender default plugins:

```json
"capabilities": {
	"requestTypes": ["gcode:load:to:visualizer"],
	"topics": ["workspace"],
	"allowedFunctions": ["gcode", "useWorkspaceState"]
}
```

`requestTypes` and `topics` are what the bridge enforces; `allowedFunctions` is the informational
record of what the static scan found. A plugin with no `capabilities` runs
but every bridge call is denied.

#### `storage`: per-plugin persisted key/value storage

Granted when a plugin imports `storage` from the SDK. Lets the plugin
read/write its own slice of the host's preferences store, keyed by the
plugin's manifest `id` — the bridge resolves this identity from the
registered plugin iframe itself, never from anything the plugin sends, so a
plugin can never read or write another plugin's data.

```json
"capabilities": {
	"requestTypes": [
		"storage:get",
		"storage:set",
		"storage:delete",
		"storage:get:all",
		"storage:set:all",
		"storage:clear"
	],
	"topics": [],
	"allowedFunctions": ["storage"]
}
```

`storage` is intentionally separate from the `gsender` combined client — a
plugin must `import { storage } from "@sienci/gsender-plugin-sdk"` directly
to be scanned and granted this permission. See the [SDK README's storage
section](../packages/plugin-sdk/README.md#plugin-storage) for the client
API.

#### `machine:parse` / `machine:query`: firmware response parsers

`machine:parse` grants a plugin the ability to match the **raw firmware
stream** with regexes it supplies, and receive the matches. It is deliberately
*not* covered by `machine:read`: that returns a curated context object, whereas
a parser sees more of the serial traffic than the console does. `machine:query`
is separate again, because sending a command and capturing its response is a
write.

```json
"parsers": [
	{
		"id": "settings",
		"mode": "block",
		"begin": { "source": "^\\$\\d+=" },
		"match": { "source": "^\\$(?<key>\\d+)=(?<value>.*)$" },
		"end": { "source": "^ok$" }
	}
],
"permissions": ["machine:parse", "machine:query"],
"capabilities": {
	"requestTypes": [
		"machine:parser:register",
		"machine:parser:unregister",
		"machine:query"
	],
	"topics": ["parser"],
	"allowedFunctions": ["machine", "onParserError"]
}
```

The `parser` topic is what delivers results to the plugin; the two
`machine:parser:*` request types are only needed for *runtime* registration
(`machine.registerParser`, `machine.onLine`).

Manifest-declared parsers are a special case for the permission scan: they run
server-side and involve **no SDK import at all**, so the static bundle scan
cannot see them. The import dialog therefore adds `machine:parse` whenever a
manifest declares `parsers`, and lists every declared pattern verbatim, so the
user can see exactly what a plugin watches before authorizing it.

Plugins that import the SDK should build with `gsenderPlugin()` from
`@sienci/gsender-plugin-sdk/vite` (see `basic-cam/vite.config.ts` and the
SDK README) — it keeps SDK imports scannable and wires the runtime import
map.

### Vite Config

Make sure that your vite config includes these rollup options:
```vite
rollupOptions: {
	external: [
		"@sienci/gsender-plugin-sdk",
		"@sienci/gsender-plugin-sdk/react",
	],
},
```
If it doesn't, gSender will assume there are no permissions needed and won't give your plugin access to the sdk at runtime.

### Building a plugin

From the plugin folder:

```bash
npm install
npm run build
```

This writes the production bundle to `ui/` (gitignored — build before copying or shipping).

For local dev in this repo you can skip copying: gSender loads `plugins/` directly when `NODE_ENV=development`.
`npm run dev`/`npm run dev:electron` also do this build for you automatically on startup (see
"Local development" below) — the manual steps above are for building a single plugin on demand
(e.g. after `npm install`ing a new dependency) without restarting the whole dev server.

### Starting from a template

1. Copy the example closest to your stack (`example-hello`, `react-ts-app`, or `example-viewer`).
2. Edit `gsender-plugin.json` — change `id`, `name`, `description`, `route`, and `label`.
3. Rename the folder (optional; the manifest `id` is what matters).
4. `npm install && npm run build`
5. Restart gSender (or rely on dev hot-reload for edits to an already-loaded plugin).

## Local development

When gSender runs in development (`NODE_ENV=development`, e.g. `npm run dev` or
`npm run electron:hot`), plugins are loaded from **both**:

1. This repo's `plugins/` folder (no copying required), and
2. The per-OS user-data plugins directory above.

Repo plugins take precedence when two share the same `id`. You can point the
server at additional folders with the `GSENDER_PLUGINS_DIRS` env var (OS path
list — `:`-separated on macOS/Linux, `;`-separated on Windows).

### Automatic SDK + plugin builds (dev)

`npm run dev` and `npm run dev:electron` both run `npm run prepare-dev-plugins` before 
starting the server. It builds the plugin SDK, then every plugin folder under `plugins/`,
skipping whatever is already up to date.

"Up to date" is decided by timestamp, not just by whether the output exists: the SDK is
rebuilt when anything under `packages/plugin-sdk/src/` (or its `package.json` /
`tsup.config.ts`) is newer than `dist/index.js`, and a plugin is rebuilt when its own
sources *or* the SDK's `dist/index.js` are newer than its `ui/` output. So pulling or
merging a branch that changes the SDK rebuilds it and every plugin on the next dev start.

The SDK is a `file:` dependency. npm symlinks it, but yarn copies it into the plugin's
`node_modules/`, and that copy is frozen at install time — reinstalling won't refresh it,
because the SDK version hasn't changed. `prepare-dev-plugins` detects those copies and
re-copies `dist/` into them before building, so a plugin never compiles against an SDK
bundle older than the one in `packages/plugin-sdk/dist/`.

Set `GSENDER_FORCE_PLUGIN_BUILD=1` to skip all of those checks and force a full rebuild
(and reinstall) of the SDK and every plugin.

### Live reload (dev)

In development the server watches each plugin's served `ui/` directory and
pushes a `plugins:changed` event over Socket.IO; open plugin iframes reload
automatically. The dev loop:

- **Built plugins**: run `npm run build -- --watch` in the plugin folder so Vite
  rewrites `ui/` on save → the iframe reloads.

Note: **adding a brand-new plugin folder** still needs a server restart (its
static route is mounted at startup); edits to already-loaded plugins hot-reload.

## Default plugins in production builds

Production builds can bundle selected default plugins into
`dist/gsender/plugins` via:

```bash
npm run prepare-default-plugins
```

`build-prod` and `build-latest` already run this automatically (including CI).
By default only `basic-cam` is bundled; override with:

```bash
GSENDER_DEFAULT_PLUGINS=basic-cam,another-plugin npm run prepare-default-plugins
```

Example plugins (`example-hello`, `react-ts-app`, `example-viewer`) are for
reference and local dev — they are **not** included in production builds unless
you add them to `GSENDER_DEFAULT_PLUGINS`.

## Plugin SDK

Install [`@sienci/gsender-plugin-sdk`](../packages/plugin-sdk) (or `file:../../packages/plugin-sdk` while developing in this repo).

| Import | Use for |
|--------|---------|
| `@sienci/gsender-plugin-sdk` | Bridge client + subscriptions (no React) |
| `@sienci/gsender-plugin-sdk/react` | `useWorkspaceState`, `useTypedSelector` |
| `@sienci/gsender-plugin-sdk/viewer` | Embedded G-code preview (`@sienci/gviewer`) |

gSender mirrors dark mode onto plugin iframes as `html.dark`. Use class-based
dark styles (`html.dark …` or Tailwind `dark:` with a class strategy), not
`prefers-color-scheme`.

See the [package README](../packages/plugin-sdk/README.md) for the full API.

### G-code preview (visualizer)

The SDK re-exports the same G-code viewer engine gSender uses
([`@sienci/gviewer`](https://www.npmjs.com/package/@sienci/gviewer)) so plugins
(e.g. a CAM tool) can render a live preview of generated toolpaths through a
single, version-pinned import. It lives on a separate entry point
(`@sienci/gsender-plugin-sdk/viewer`) so the three.js/gviewer bundle only loads
for plugins that use it. This requires a bundler, so the plugin must be built
(like `example-viewer` or `basic-cam`) and depend on `@sienci/gviewer` + `three`.

The viewer is loaded imperatively via its ref (`loadFromText`, `focusToModel`,
`setOptions`, `snapCameraToView`, …) — see the
[gviewer docs](https://www.npmjs.com/package/@sienci/gviewer) for the full API.

**React:**

```tsx
import {
	GCodeVisualizer,
	type GCodeViewerHandle,
} from "@sienci/gsender-plugin-sdk/viewer";
import { useEffect, useRef } from "react";

const ref = useRef<GCodeViewerHandle>(null);
useEffect(() => {
	ref.current?.loadFromText(gcode).then(() => ref.current?.focusToModel());
}, [gcode]);

<GCodeVisualizer ref={ref} id="my-preview" style={{ height: 320 }} />;
```

**Non-React (imperative):**

```js
import { GCodeViewer } from "@sienci/gsender-plugin-sdk/viewer";

const viewer = new GCodeViewer({
	id: "my-preview",
	container: document.getElementById("preview"),
});
await viewer.loadFromText(gcode);
viewer.focusToModel();
// viewer.dispose(); // on teardown
```

Install the peers in the plugin: `npm install @sienci/gviewer three`.

### Host visualizer bridge (`gsender.viewer`)

Distinct from the embedded G-code preview above, the `gsender.viewer.*` API lets a
plugin drive gSender's **main** visualizer over the bridge: pick points on the
loaded toolpath, draw markers on it, and control the host camera. It's part of the
base client (`@sienci/gsender-plugin-sdk`) — no bundler or extra peers required.

#### `visualizer-overlay` contribution slot

To surface a plugin over the main visualizer, declare a `visualizer-overlay`
contribution in `gsender-plugin.json`:

```json
{
	"contributions": [
		{ "slot": "visualizer-overlay", "label": "Corner Finder", "icon": "🎯" }
	]
}
```

`icon` is rendered as-is inside a small circular button (not looked up against an icon set) — use
a single emoji, not a word.

The host shows a floating toggle button (using your `label`/`icon`) on the main
visualizer; clicking it opens the plugin panel docked over the canvas, where your
UI can call the `gsender.viewer.*` API against the visualizer behind it.

#### API

| Method | Description |
|--------|-------------|
| `viewer.screenToWorld(px, py)` | Project a screen pixel to world `{x,y,z}` (or `null`). |
| `viewer.worldToScreen(x, y, z?)` | Project a world point to a screen pixel `{x,y}` (or `null`). |
| `viewer.camera.set(view)` | Snap the camera to `'top' \| '3d' \| 'front' \| 'left' \| 'right'`. |
| `viewer.camera.lockRotate(locked)` | Lock/unlock camera rotation. |
| `viewer.armPick(mode, cb)` | Arm point-picking (`'click'` or `'hold'`); resolves to a disposer. |
| `viewer.disarmPick()` | Disarm point-picking. |
| `viewer.setOverlay(markers)` | Replace the overlay markers drawn on the visualizer. |

`armPick` subscribes to pick events **before** arming (so none are missed) and
resolves to a disposer that both disarms and unsubscribes — call it when you're
done. The callback receives `ViewerPickEvent`s:

- `{ kind: 'pick', world: {x,y,z}, screen: {x,y} }` — a point was picked.
- `{ kind: 'hold-progress', t }` — `t` runs `0..1` while a press-and-hold is in progress.

Overlay markers use the shared `OverlayMarker` shape (world coordinates):

```ts
interface OverlayMarker {
	id: string;
	x: number; y: number; z?: number;    // world coordinates
	shape?: "circle" | "cross" | "ring"; // default "circle"
	color?: string;                       // CSS color
	size?: number;                        // px, default 6
	label?: string;
}
```

**Example** — arm a click pick, drop a marker where the user clicks, then jump the
camera to top:

```ts
import { gsender } from "@sienci/gsender-plugin-sdk";

const dispose = await gsender.viewer.armPick("click", async (e) => {
	if (e.kind !== "pick") return;
	await gsender.viewer.setOverlay([
		{ id: "hit", x: e.world.x, y: e.world.y, shape: "cross", color: "#f0f" },
	]);
	await gsender.viewer.camera.set("top");
	dispose(); // one-shot: disarm after the first pick
});
```

#### `useVisualizerPick` (React)

```tsx
import { useVisualizerPick } from "@sienci/gsender-plugin-sdk/react";

function CornerFinder() {
	const { armed, error } = useVisualizerPick("click", (e) => {
		if (e.kind === "pick") console.log("picked", e.world);
	});

	if (error) return <p>Can't pick: {error}</p>;
	return <p>{armed ? "Click a point on the visualizer…" : "Arming…"}</p>;
}
```

It arms on mount (unless `opts.enabled === false`), disarms on unmount/disable,
keeps the latest `handler` in a ref (re-renders don't re-arm), and reports whether
arming succeeded (`armed`) plus the host's rejection message (`error`).

#### Arming preconditions

`armPick` / `useVisualizerPick` **reject** unless all of the following hold. The
rejection surfaces as the thrown/`error` message from the host:

- the primary visualizer is mounted,
- the loaded file is **not** rotary, and
- the machine is **connected and idle**.
