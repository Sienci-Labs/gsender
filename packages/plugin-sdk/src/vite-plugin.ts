// src/vite-plugin.ts
// Ships as the "@sienci/gsender-plugin-sdk/vite" export.
//
// Plugin authors add this to their vite.config and never need to know
// the SDK is externalized — gSender's host page provides the real
// SDK modules at runtime via its own import map.
//
// "react" is ALSO externalized here — but NOT resolved by gSender's host.
// Each plugin gets its OWN single React instance (per the SDK's design),
// shared between the plugin's own components and the SDK's hooks
// (@sienci/gsender-plugin-sdk/react). If either side bundled its own copy
// of React, hooks would break with "Invalid hook call" because they'd be
// running against two different dispatcher instances. So this plugin
// vendors one React build into the output and injects an import map
// entry pointing "react" at it — all automatically, so plugin authors
// never see any of this.
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { build } from "esbuild";
import type { Plugin } from "vite";

// Keep this in sync with the package.json "exports" map. These stay
// external so gSender's host can statically scan a plugin's bundle for
// which SDK functions it imports, before granting permission to load it.
const SDK_SPECIFIERS = [
	"@sienci/gsender-plugin-sdk",
	"@sienci/gsender-plugin-sdk/react",
	"@sienci/gsender-plugin-sdk/viewer",
];

// Externalized so the app's own `import ... from "react"` (and React's
// own JSX-runtime imports, and react-dom) stay bare specifiers too,
// resolving to the SAME vendored files as the SDK's hooks. jsx-runtime is
// used for production JSX output, jsx-dev-runtime for dev mode — both
// need entries since @vitejs/plugin-react picks whichever mode applies.
const REACT_EXTERNALS: Record<string, string> = {
	react: "react",
	"react-dom": "react-dom",
	"react-dom/client": "react-dom/client",
	"react/jsx-runtime": "react/jsx-runtime",
	"react/jsx-dev-runtime": "react/jsx-dev-runtime",
};

const isExternalSpecifier = (source: string) =>
	SDK_SPECIFIERS.includes(source) || source in REACT_EXTERNALS;

export default function gsenderPlugin(): Plugin {
	let outDir = "dist";
	let mode: "development" | "production" = "production";

	return {
		name: "gsender-plugin-sdk",
		config(config) {
			const existingExternal = config.build?.rollupOptions?.external;

			return {
				build: {
					rollupOptions: {
						external(source, importer, isResolved) {
							if (isExternalSpecifier(source)) return true;

							if (typeof existingExternal === "function") {
								return existingExternal(source, importer, isResolved);
							}
							if (Array.isArray(existingExternal)) {
								return existingExternal.some((entry) =>
									entry instanceof RegExp
										? entry.test(source)
										: entry === source,
								);
							}
							if (existingExternal instanceof RegExp) {
								return existingExternal.test(source);
							}
							if (typeof existingExternal === "string") {
								return existingExternal === source;
							}
							return false;
						},
					},
				},
			};
		},
		configResolved(config) {
			outDir = config.build.outDir;
			mode = config.mode === "development" ? "development" : "production";
		},
		// Bundle standalone ESM builds of react/react-dom/jsx-runtimes and
		// drop them into the plugin's own output, so each externalized
		// specifier has somewhere real to resolve to.
		async closeBundle() {
			const vendorDir = path.resolve(outDir, "vendor");
			await mkdir(vendorDir, { recursive: true });

			// `export * from "react"` doesn't reliably work here: React's own
			// index.js reassigns `module.exports` to the return value of a
			// NESTED require() call, and esbuild won't statically trace
			// through that indirection to enumerate property names. Only
			// `default` gets special-cased interop support automatically —
			// everything else (useState, etc.) ends up copied onto the
			// module at runtime, which is invisible to native ESM's static
			// named-export resolution.
			//
			// The fix: enumerate each package's REAL exports ourselves via
			// Node's require() (this plugin runs in Node, so we can just ask
			// the actual installed package what it exports), then generate
			// an explicit `import { a, b, c } from "x"; export { a, b, c };`
			// list. Explicit named references like this work reliably
			// because esbuild just treats them as property access + a
			// normal local export, not a wildcard scan. This also stays
			// correct automatically as React's API changes across versions,
			// instead of drifting out of sync with a hardcoded list.
			const nodeRequire = createRequire(import.meta.url);
			const getExportNames = (specifier: string): string[] => {
				const resolved = nodeRequire.resolve(specifier, {
					paths: [process.cwd()],
				});
				const mod = nodeRequire(resolved);
				return Object.keys(mod).filter((key) => key !== "default");
			};

			for (const specifier of Object.keys(REACT_EXTERNALS)) {
				const names = getExportNames(specifier);
				const namedList = names.join(", ");
				const contents = [
					names.length > 0
						? `import { ${namedList} } from "${specifier}"; export { ${namedList} };`
						: "",
					`export { default } from "${specifier}";`,
				]
					.filter(Boolean)
					.join("\n");

				const outfile = path.join(
					vendorDir,
					`${specifier.replace(/\//g, "-")}.js`,
				);
				await build({
					stdin: {
						contents,
						resolveDir: process.cwd(),
						loader: "js",
					},
					bundle: true,
					format: "esm",
					outfile,
					define: {
						"process.env.NODE_ENV": JSON.stringify(mode),
					},
				});
			}
		},
		// Inject the import map for react/react-dom/jsx-runtimes into the
		// built index.html. The SDK specifiers are intentionally NOT added
		// here — those are gSender's host page's responsibility to resolve,
		// not the plugin's.
		transformIndexHtml() {
			const imports = Object.fromEntries(
				Object.keys(REACT_EXTERNALS).map((specifier) => [
					specifier,
					`./vendor/${specifier.replace(/\//g, "-")}.js`,
				]),
			);
			return [
				{
					tag: "script",
					attrs: { type: "importmap" },
					injectTo: "head-prepend",
					children: JSON.stringify({ imports }, null, 2),
				},
			];
		},
	};
}