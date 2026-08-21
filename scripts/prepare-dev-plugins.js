const fs = require("fs");
const path = require("path");
const { run, readJson } = require("./lib/shell-utils");

const REPO_ROOT = path.resolve(__dirname, "..");
const PLUGINS_ROOT = path.join(REPO_ROOT, "plugins");
const PLUGIN_SDK_DIR = path.join(REPO_ROOT, "packages", "plugin-sdk");
const PLUGIN_SDK_ENTRY = path.join(PLUGIN_SDK_DIR, "dist", "index.js");

const FORCE = process.env.GSENDER_FORCE_PLUGIN_BUILD === "1";
const STRICT = process.env.GSENDER_STRICT_DEV_PLUGINS === "1";

const detectPackageManager = (dir) =>
	fs.existsSync(path.join(dir, "yarn.lock")) ? "yarn" : "npm";

const install = (dir) => {
	if (detectPackageManager(dir) === "yarn") {
		run(
			"yarn",
			["--cwd", path.relative(REPO_ROOT, dir), "install", "--non-interactive"],
			REPO_ROOT,
		);
	} else {
		run("npm", ["install"], dir);
	}
};

const ensureDependenciesInstalled = (dir) => {
	if (!fs.existsSync(path.join(dir, "package.json"))) {
		return;
	}
	if (!FORCE && fs.existsSync(path.join(dir, "node_modules"))) {
		return;
	}
	install(dir);
};

const ensurePluginSdkBuilt = () => {
	const packageJsonPath = path.join(PLUGIN_SDK_DIR, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	if (!FORCE && fs.existsSync(PLUGIN_SDK_ENTRY)) {
		console.log(
			"Plugin SDK already built, skipping (set GSENDER_FORCE_PLUGIN_BUILD=1 to force).",
		);
		return;
	}

	console.log("Building @sienci/gsender-plugin-sdk...");
	ensureDependenciesInstalled(PLUGIN_SDK_DIR);
	run(detectPackageManager(PLUGIN_SDK_DIR), ["run", "build"], PLUGIN_SDK_DIR);
};

const discoverPluginDirs = () => {
	if (!fs.existsSync(PLUGINS_ROOT)) {
		return [];
	}

	return fs
		.readdirSync(PLUGINS_ROOT, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.filter((name) =>
			fs.existsSync(path.join(PLUGINS_ROOT, name, "gsender-plugin.json")),
		);
};

const buildPlugin = (name) => {
	const pluginDir = path.join(PLUGINS_ROOT, name);
	const packageJsonPath = path.join(pluginDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	const pkg = readJson(packageJsonPath);
	if (!pkg.scripts || !pkg.scripts.build) {
		return;
	}

	const manifest = readJson(path.join(pluginDir, "gsender-plugin.json"));
	const entry = manifest?.ui?.entry;
	const entryPath = entry ? path.join(pluginDir, entry) : null;

	if (!FORCE && entryPath && fs.existsSync(entryPath)) {
		console.log(`${name}: already built, skipping.`);
		return;
	}

	console.log(`Building plugin: ${name}`);
	ensureDependenciesInstalled(pluginDir);
	run(detectPackageManager(pluginDir), ["run", "build"], pluginDir);
};

const main = () => {
	ensurePluginSdkBuilt();

	const names = discoverPluginDirs();
	if (names.length === 0) {
		console.log("No plugins found under plugins/. Skipping.");
		return;
	}

	const failed = [];
	names.forEach((name) => {
		try {
			buildPlugin(name);
		} catch (err) {
			console.error(`Failed to build plugin "${name}": ${err.message}`);
			failed.push(name);
		}
	});

	if (failed.length > 0) {
		console.warn(
			`${failed.length} plugin(s) failed to build: ${failed.join(", ")}`,
		);
		if (STRICT) {
			process.exit(1);
		}
	}
};

main();
