const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const PLUGINS_ROOT = path.join(REPO_ROOT, "plugins");
const OUTPUT_ROOT = path.join(REPO_ROOT, "dist", "gsender", "plugins");

const DEFAULT_PLUGINS = (
	process.env.GSENDER_DEFAULT_PLUGINS || "basic-cam"
)
	.split(",")
	.map((name) => name.trim())
	.filter(Boolean);

const run = (command, args, cwd) => {
	const result = spawnSync(command, args, {
		cwd,
		stdio: "inherit",
		shell: process.platform === "win32",
	});

	if (result.status !== 0) {
		throw new Error(
			`Command failed: ${command} ${args.join(" ")} (cwd: ${cwd})`,
		);
	}
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const ensureBuiltUi = (pluginDir) => {
	const packageJsonPath = path.join(pluginDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	const pkg = readJson(packageJsonPath);
	if (!pkg.scripts || !pkg.scripts.build) {
		return;
	}

	const nodeModulesPath = path.join(pluginDir, "node_modules");
	if (!fs.existsSync(nodeModulesPath)) {
		run("npm", ["install"], pluginDir);
	}

	run("npm", ["run", "build"], pluginDir);
};

const copyPlugin = (pluginName) => {
	const pluginDir = path.join(PLUGINS_ROOT, pluginName);
	if (!fs.existsSync(pluginDir)) {
		throw new Error(`Default plugin not found: ${pluginName}`);
	}

	const manifestPath = path.join(pluginDir, "gsender-plugin.json");
	if (!fs.existsSync(manifestPath)) {
		throw new Error(`Missing gsender-plugin.json for plugin: ${pluginName}`);
	}

	ensureBuiltUi(pluginDir);

	const manifest = readJson(manifestPath);
	const entry = manifest?.ui?.entry;
	if (!entry) {
		throw new Error(`Missing ui.entry in manifest for plugin: ${pluginName}`);
	}

	const entryPath = path.join(pluginDir, entry);
	if (!fs.existsSync(entryPath)) {
		throw new Error(
			`Built UI entry not found for plugin "${pluginName}": ${entry}`,
		);
	}

	const destDir = path.join(OUTPUT_ROOT, pluginName);
	fs.mkdirSync(destDir, { recursive: true });
	fs.copyFileSync(manifestPath, path.join(destDir, "gsender-plugin.json"));

	const uiDir = path.join(pluginDir, "ui");
	if (!fs.existsSync(uiDir)) {
		throw new Error(`Missing ui directory for plugin: ${pluginName}`);
	}

	fs.cpSync(uiDir, path.join(destDir, "ui"), { recursive: true });
};

const main = () => {
	if (DEFAULT_PLUGINS.length === 0) {
		console.log("No default plugins configured. Skipping.");
		return;
	}

	fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
	fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

	DEFAULT_PLUGINS.forEach((pluginName) => {
		console.log(`Preparing default plugin: ${pluginName}`);
		copyPlugin(pluginName);
	});

	console.log(
		`Prepared ${DEFAULT_PLUGINS.length} default plugin(s) in ${OUTPUT_ROOT}`,
	);
};

main();
