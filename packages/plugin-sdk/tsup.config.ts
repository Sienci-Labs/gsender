import { defineConfig } from "tsup";

export default defineConfig([
	// Browser-facing SDK runtime — loaded inside a plugin's own bundle.
	// react/three/gviewer are inlined so consumers never see a bare
	// "react" (etc.) import left over in the output.
	{
		entry: {
			index: "src/index.ts",
			react: "src/react.ts",
			viewer: "src/viewer.ts",
		},
		format: ["esm"],
		platform: "browser",
		dts: true,
		outDir: "dist",
		noExternal: ["react", "three", "@sienci/gviewer"],
		splitting: false,
		clean: true,
	},
	// Node-side Vite plugin — dev tooling that runs during a plugin
	// author's own `vite build`, not shipped to the browser. Vite itself
	// stays external since the consumer already has it installed.
	{
		entry: { "vite-plugin": "src/vite-plugin.ts" },
		format: ["esm"],
		platform: "node",
		dts: true,
		outDir: "dist",
		external: ["vite"],
		splitting: false,
		clean: false, // don't wipe the browser build's output above
	},
]);
