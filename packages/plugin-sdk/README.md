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

### Bridge client (default)

Framework-agnostic RPC + subscriptions. Safe for vanilla JS, Vue, Svelte, etc. — does **not** import React.

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
| `gsender.machine.getContext()` | Current machine / controller context |
| `gsender.machine.command(cmd, ...args)` | Run a host machine command |
| `gsender.workspace.getState()` | One-shot workspace snapshot |
| `gsender.redux.getState()` | One-shot full Redux state |
| `gsender.gcode.loadToVisualizer(gcode, name?)` | Load G-code into the main visualizer/job |
| `subscribeWorkspaceState(cb)` | Live workspace updates |
| `subscribeSelector(selector, cb, equalityFn?)` | Live Redux slice |
| `useWorkspaceState()` | React hook for workspace |
| `useTypedSelector(selector, equalityFn?)` | React hook for Redux slice |

Plugins run in an iframe; the SDK posts messages on the `gsender:plugin-bridge` channel to the parent window.

## License

MIT
