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

Each folder must contain `gsender-plugin.json` and a `ui/` directory with the built SPA entry file.

### Building a plugin

From the plugin folder:

```bash
npm install
npm run build
```

This writes the production bundle to `ui/` (gitignored — build before copying or shipping).

For local dev in this repo you can skip copying: gSender loads `plugins/` directly when `NODE_ENV=development`.

### Starting from a template

1. Copy the example closest to your stack (`example-hello`, `react-ts-app`, or `example-viewer`).
2. Edit `gsender-plugin.json` — change `id`, `name`, `route`, and `label`.
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
