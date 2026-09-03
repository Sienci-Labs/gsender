import { defineConfig } from "vite";

export default defineConfig({
	base: "./",
	build: {
		outDir: "ui",
		emptyOutDir: true,
	},
});
