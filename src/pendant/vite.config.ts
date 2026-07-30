import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import type { Plugin, ViteDevServer } from "vite";

const root = path.resolve(__dirname, "../..");

// Tailwind v3 + PostCSS only re-runs when the CSS entry file itself is touched.
// This plugin watches all Tailwind content directories (including those outside
// the Vite root) and invalidates the CSS module whenever a source file changes,
// so new utility classes appear in the browser without a manual refresh.
function tailwindHmr(): Plugin {
	const contentDirs = [
		path.join(__dirname, "src"),
		path.join(root, "src/app/src"),
	];
	const cssEntry = path.join(__dirname, "src/index.css");

	return {
		name: "tailwind-hmr",
		configureServer(server: ViteDevServer) {
			contentDirs.forEach((dir) => server.watcher.add(dir));

			server.watcher.on("change", (file: string) => {
				if (
					contentDirs.some((d) => file.startsWith(d)) &&
					/\.(tsx?|jsx?|html)$/.test(file)
				) {
					const mods = server.moduleGraph.getModulesByFile(cssEntry);
					mods?.forEach((m) => server.moduleGraph.invalidateModule(m));
					server.ws.send({ type: "full-reload" });
				}
			});
		},
	};
}

export default defineConfig({
	root: path.resolve(__dirname, "./"),
	base: "./",
	plugins: [react(), tailwindHmr()],
	resolve: {
		alias: {
			// app/ → src/app/src/ so shared features can resolve their app/* utilities
			"app-root": root,
			app: path.join(root, "src/app/src"),
			"@": path.join(root, "src/app/src"),
		},
	},
	server: {
		port: 5174,
		proxy: {
			"/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
			"/socket.io": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
				ws: true,
			},
		},
	},
	build: {
		outDir: path.join(root, "dist/gsender/pendant"),
		emptyOutDir: true,
	},
});
