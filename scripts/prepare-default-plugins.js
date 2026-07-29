const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const PLUGINS_ROOT = path.join(REPO_ROOT, "plugins");
const OUTPUT_ROOT = path.join(REPO_ROOT, "dist", "gsender", "plugins");
const PLUGIN_SDK_DIR = path.join(REPO_ROOT, "packages", "plugin-sdk");
const PLUGIN_SDK_ENTRY = path.join(PLUGIN_SDK_DIR, "dist", "index.js");

const DEFAULT_PLUGINS = (
	process.env.GSENDER_DEFAULT_PLUGINS || "basic-cam"
)
	.split(",")
	.map((name) => name.trim())
	.filter(Boolean);

const run = (command, args) => {
	const result = spawnSync(command, args, {
		cwd: REPO_ROOT,
		stdio: "inherit",
		shell: process.platform === "win32",
	});

	if (result.status !== 0) {
		throw new Error(`Command failed: ${command} ${args.join(" ")}`);
	}
};

const runYarn = (packageDir, args) => {
	const relativeDir = path.relative(REPO_ROOT, packageDir);
	run("yarn", ["--cwd", relativeDir, ...args]);
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const ensureDependenciesInstalled = (packageDir) => {
	const packageJsonPath = path.join(packageDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	const nodeModulesPath = path.join(packageDir, "node_modules");
	if (!fs.existsSync(nodeModulesPath)) {
		runYarn(packageDir, ["install", "--non-interactive"]);
	}
};

const ensurePluginSdkBuilt = () => {
	const packageJsonPath = path.join(PLUGIN_SDK_DIR, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	if (fs.existsSync(PLUGIN_SDK_ENTRY)) {
		return;
	}

	console.log("Building @sienci/gsender-plugin-sdk...");
	ensureDependenciesInstalled(PLUGIN_SDK_DIR);
	runYarn(PLUGIN_SDK_DIR, ["run", "build"]);
};

const ensureBuiltUi = (pluginDir) => {
	const packageJsonPath = path.join(pluginDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	const pkg = readJson(packageJsonPath);
	if (!pkg.scripts || !pkg.scripts.build) {
		return;
	}

	ensureDependenciesInstalled(pluginDir);
	runYarn(pluginDir, ["run", "build"]);
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

	ensurePluginSdkBuilt();

	DEFAULT_PLUGINS.forEach((pluginName) => {
		console.log(`Preparing default plugin: ${pluginName}`);
		copyPlugin(pluginName);
	});

	console.log(
		`Prepared ${DEFAULT_PLUGINS.length} default plugin(s) in ${OUTPUT_ROOT}`,
	);
};

main();
