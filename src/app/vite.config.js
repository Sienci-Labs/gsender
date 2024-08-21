import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    root: path.resolve(__dirname, "./"), // Set root to the directory containing index.html
    base: "./",
    build: {
        outDir: path.resolve(__dirname, "../../dist/gsender/app"), // Output directly to /output/app
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, "./src/entry-client.tsx"), // Main entry point
            },
            output: {
                assetFileNames: "assets/[name].[ext]",
            },
        },
    },
    css: {
        postcss: {
            plugins: [tailwindcss()],
        },
    },
    plugins: [
        TanStackRouterVite({
            routesDirectory: path.resolve(__dirname, "./src/routes"),
            generatedRouteTree: path.resolve(
                __dirname,
                "./src/routeTree.gen.ts",
            ),
        }),
        tsconfigPaths(),
        react(),
    ],
});
