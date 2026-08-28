const fs = require("fs");
const { spawnSync } = require("child_process");

const run = (command, args, cwd) => {
	const result = spawnSync(command, args, {
		cwd,
		stdio: "inherit",
		shell: process.platform === "win32",
	});

	if (result.status !== 0) {
		throw new Error(`Command failed: ${command} ${args.join(" ")}`);
	}
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

module.exports = { run, readJson };
