import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import { patchCssModules } from "vite-css-modules";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	root: path.resolve(__dirname, "./"), // Set root to the directory containing index.html
	base: "./",
	css: {
		postcss: {
			plugins: [tailwindcss()],
		},
		preprocessorOptions: { stylus: { modules: true } },
		modules: {
			// Enable CSS Modules for all .scss files
			localsConvention: "camelCaseOnly",
			generateScopedName: "[name]__[local]___[hash:base64:5]",
		},
		devSourcemap: true,
	},
	plugins: [
		tsconfigPaths(),
		react(),
		patchCssModules(),
		tailwindcss(),
		nodePolyfills({
			// @react-pdf/renderer (js-md5) needs Buffer in the browser bundle
			include: ["buffer", "process"],
			globals: { Buffer: true, global: true, process: true },
		}),
		sentryVitePlugin({
			org: process.env.SENTRY_ORG,
			project: process.env.SENTRY_PROJECT,
			authToken: process.env.SENTRY_AUTH_TOKEN,
		}),
	],
	resolve: {
		alias: {
			app: path.resolve(__dirname, "./src"),
			"@": path.resolve(__dirname, "./src"),
		},
		dedupe: ["react", "react-dom"],
	},
	define: {},
	server: {
		hmr: {
			overlay: false,
		},
		proxy: {
			"/api": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
			},
			"/plugins": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
			},
			"/socket.io": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
				ws: true,
			},
		},
	},
	optimizeDeps: {
		include: ["**/*.styl", "buffer", "@react-pdf/renderer"],
	},
	build: {
		sourcemap: true,
		/*rollupOptions: {
            rollupOptions: {
                external: ['unenv/node/process']
            }
        }*/
	},
});
