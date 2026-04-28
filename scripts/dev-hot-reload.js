#!/usr/bin/env node

/**
 * Watches electron-app files and recompiles them with Babel when changed.
 * This works alongside esbuild's watch mode for hot reloading.
 */

const chokidar = require("chokidar");
const path = require("path");
const { execSync } = require("child_process");

console.log("👀 Watching electron-app files for hot reload...\n");

// Compile electron-app files
function compileElectronApp() {
	const timestamp = new Date().toLocaleTimeString();
	console.log(`[${timestamp}] 🔧 Compiling electron-app...`);

	try {
		const rootDir = path.join(__dirname, "..");
		execSync(
			"npx babel src/electron-app --config-file ./babel.config.js --out-dir output/electron-app --quiet",
			{
				cwd: rootDir,
				stdio: "pipe",
				env: { ...process.env, NODE_ENV: "development" },
				shell: true,
			},
		);
		console.log(
			`[${timestamp}] ✅ electron-app compiled (Electron will auto-reload)\n`,
		);
	} catch (err) {
		console.error(`[${timestamp}] ❌ Compilation error:`, err.message);
	}
}

// Initial compilation
compileElectronApp();

// Watch electron-app files
const watcher = chokidar.watch("src/electron-app/**/*.js", {
	persistent: true,
	ignoreInitial: true,
	cwd: path.join(__dirname, ".."),
});

watcher.on("change", (file) => {
	console.log(`\n📝 ${file} changed`);
	compileElectronApp();
});

watcher.on("add", (file) => {
	console.log(`\n➕ ${file} added`);
	compileElectronApp();
});

console.log("✨ Hot reload ready!\n");
console.log("   • esbuild watches: src/server, src/main.js, src/server-cli.js");
console.log("   • babel watches: src/electron-app");
console.log("   • nodemon/electron-reloader: auto-restart on changes\n");

// Cleanup on exit
process.on("SIGINT", () => {
	console.log("\n🛑 Stopping watcher...");
	watcher.close();
	process.exit(0);
});

process.on("SIGTERM", () => {
	watcher.close();
	process.exit(0);
});
