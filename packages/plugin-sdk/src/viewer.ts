// Re-exports gSender's G-code viewer (the same @sienci/gviewer engine the host
// visualizer uses) so plugins get a version-pinned preview through a single SDK
// import surface. This lives on its own entry point (`.../viewer`) so the
// three.js/gviewer bundle only loads for plugins that actually use it.
//
// React: `import { GCodeVisualizer } from "@sienci/gsender-plugin-sdk/viewer"`
//   Render with a stable `id` and drive it via a ref (`loadFromText`, etc.).
// Imperative (non-React): `import { GCodeViewer } from "@sienci/gsender-plugin-sdk/viewer"`
//
// Requires the plugin to install the peers: `@sienci/gviewer` and `three`.

// Bundles the viewcube styles used by the 3D viewer's camera overlay.
import "@sienci/gviewer/viewer/viewcube.css";

export * from "@sienci/gviewer/react";
export * from "@sienci/gviewer/viewer";
