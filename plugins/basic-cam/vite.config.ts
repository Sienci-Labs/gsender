import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite"; //TODO: remove PluginOption once we are no longer testing with local sdk
import gsenderPlugin from "../../packages/plugin-sdk/dist/vite-plugin";

export default defineConfig({
	plugins: [react(), tailwindcss(), gsenderPlugin() as PluginOption],
	base: "./",
	build: {
		outDir: "ui",
		emptyOutDir: true,
	},
});
