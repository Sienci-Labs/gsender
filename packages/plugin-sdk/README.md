# @sienci/gsender-plugin-sdk

SDK for building [gSender](https://github.com/Sienci-Labs/gsender) UI plugins. Talk to the host app over the plugin bridge, subscribe to live state, and optionally embed the same G-code viewer gSender uses.

## Install

```bash
npm install @sienci/gsender-plugin-sdk
```

Peer dependencies are optional and only needed for the entry points that use them:

| Entry | Peers |
|-------|--------|
| `@sienci/gsender-plugin-sdk` | none |
| `@sienci/gsender-plugin-sdk/react` | `react` ≥ 18 |
| `@sienci/gsender-plugin-sdk/viewer` | `@sienci/gviewer`, `three` |

```bash
# React hooks
npm install react

# G-code preview
npm install @sienci/gviewer three
```

## Entries

### Build plugin (`/vite`)

Add the SDK's Vite plugin to your build — it is the only build config a
plugin needs:

```ts
// vite.config.ts
import gsenderPlugin from "@sienci/gsender-plugin-sdk/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), gsenderPlugin()],
	base: "./",
	build: { outDir: "ui", emptyOutDir: true },
});
```

It handles everything the gSender host needs, automatically:

- Keeps the SDK's specifiers **external** in your bundle, so gSender can
  statically scan which SDK functions you import and show the user an
  accurate permission prompt. At runtime they resolve (via an injected
  import map) to the SDK copy **gSender itself serves** at
  `/plugin-sdk/*.js` — the executing SDK always matches the host's bridge.
- Keeps `react`/`react-dom`/JSX runtimes external too, and vendors one
  shared React build into `ui/vendor/` (single React instance — hooks in
  your components and in the SDK share the same dispatcher).
- Injects the import map into your built `index.html`.

Note the built `ui/` only runs inside gSender's plugin iframe (`vite preview` will
not resolve the SDK imports).

### Bridge client (default)

Framework-agnostic RPC + subscriptions. Safe for vanilla JS, Vue, Svelte, etc. — does **not** import React.

Individual clients:
- `machine`
- `workspace`
- `redux`
- `gcode`
- `storage`

`gsender` includes `machine`, `workspace`, `redux`, and `gcode` in one object. `storage` is **not** included in `gsender` — it must be imported on its own (see below).

```ts
import {
  gsender,
  getWorkspaceState,
  subscribeWorkspaceState,
  subscribeSelector,
} from "@sienci/gsender-plugin-sdk";

const ctx = await gsender.machine.getContext();
await gsender.gcode.loadToVisualizer(gcode, "job.nc");

const unsub = subscribeWorkspaceState((state) => {
  console.log(state);
});
```

### Plugin storage

Each plugin gets its own persisted key/value slice on the host, namespaced to
that plugin's manifest `id` — no plugin can read or write another plugin's
data. Requires the `storage` permission (see the [manifest capabilities
docs](../../plugins/README.md#manifest-capabilities)).

`storage` is deliberately **not** part of the `gsender` combined client: the
host derives permission grants from a static scan of which SDK names a plugin
imports, so `storage` needs its own explicit import to get its own,
separately-approved permission rather than riding along with `gsender`.

```ts
import { storage } from "@sienci/gsender-plugin-sdk";

await storage.set("apiKey", "abc123");
const apiKey = await storage.get("apiKey"); // "abc123"
const units = await storage.get("units", "mm"); // default if unset

const all = await storage.getAll(); // whole namespaced object
await storage.setAll({ apiKey: "abc123", units: "mm" }); // replace it wholesale

await storage.delete("apiKey");
await storage.clear(); // wipe this plugin's storage entirely
```

### React hooks

```tsx
import { gsender } from "@sienci/gsender-plugin-sdk";
import {
  useWorkspaceState,
  useTypedSelector,
} from "@sienci/gsender-plugin-sdk/react";

const workspace = useWorkspaceState();
const isConnected = useTypedSelector((s) => s.connection?.isConnected);
```

### G-code viewer

Uses `@sienci/gviewer` (same engine as gSender’s visualizer). Requires a bundler.

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

<GCodeVisualizer ref={ref} id="preview" style={{ height: 320 }} />;
```

**Imperative:**

```js
import { GCodeViewer } from "@sienci/gsender-plugin-sdk/viewer";

const viewer = new GCodeViewer({
  id: "preview",
  container: document.getElementById("preview"),
});
await viewer.loadFromText(gcode);
viewer.focusToModel();
```

## Bridge API surface

| API | Description |
|-----|-------------|
| `machine.getContext()` | Current machine / controller context |
| `machine.command(cmd, ...args)` | Run a host machine command |
| `workspace.getState()` | One-shot workspace snapshot |
| `redux.getState()` | One-shot full Redux state |
| `gcode.loadToVisualizer(gcode, name?)` | Load G-code into the main visualizer/job |
| `storage.get(key, defaultValue?)` | Read a value from this plugin's own namespaced storage |
| `storage.set(key, value)` | Write a value to this plugin's own namespaced storage |
| `storage.delete(key)` | Delete a key from this plugin's own namespaced storage |
| `storage.getAll(defaultValue?)` | Read this plugin's entire namespaced storage object |
| `storage.setAll(value)` | Replace this plugin's entire namespaced storage object |
| `storage.clear()` | Clear this plugin's entire namespaced storage object |
| `subscribeWorkspaceState(cb)` | Live workspace updates |
| `subscribeSelector(selector, cb, equalityFn?)` | Live Redux slice |
| `useWorkspaceState()` | React hook for workspace |
| `useTypedSelector(selector, equalityFn?)` | React hook for Redux slice |

Plugins run in an iframe; the SDK posts messages on the `gsender:plugin-bridge` channel to the parent window. gSender mirrors dark mode onto the iframe as `html.dark` — style plugins with class-based dark mode, not `prefers-color-scheme`.

## License

MIT
