import fs from "fs";
import path from "path";
import semver from "semver";
import pkg from "../../../package.json";
import logger from "../../lib/logger";

const log = logger("service:preferencesStore") as {
	error: Function;
	warn: Function;
	info: Function;
	debug: Function;
};

export interface PreferencesData {
	version?: string;
	state?: any;
}

type BackupFrequency = "On Update" | "Daily" | "Weekly" | "Monthly";

const PREFERENCES_FILE = "gsender-preferences.json";
const LEGACY_FILE = "gsender-0.5.6.json";
const WRITE_DEBOUNCE_MS = 250;
const MAX_BACKUPS = 3;
const BACKUP_PATTERN = /^preferences-backup-.*\.json$/;

const INTERVALS: Record<string, number> = {
	Daily: 1000 * 60 * 60 * 24,
	Weekly: 1000 * 60 * 60 * 24 * 7,
	Monthly: 1000 * 60 * 60 * 24 * 30,
};

// write temp file, same as configstore
const writeFileAtomicSync = (file: string, content: string) => {
	const tmpFile = `${file}.${process.pid}.tmp`;
	const fd = fs.openSync(tmpFile, "w");
	try {
		fs.writeFileSync(fd, content, "utf8");
		fs.fsyncSync(fd);
	} finally {
		fs.closeSync(fd);
	}
	fs.renameSync(tmpFile, file);
};

const readJson = (file: string): PreferencesData | null => {
	const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("not a JSON object");
	}
	return parsed;
};

class PreferencesStore {
	dir = "";
	file = "";
	data: PreferencesData = {};
	private timer: NodeJS.Timeout | null = null;
	private dirty = false;
	private exitHookInstalled = false;

	load(userDataDir: string) {
		this.dir = userDataDir;
		this.file = path.join(userDataDir, PREFERENCES_FILE);
		this.data = {};

		let loaded = false;

		if (fs.existsSync(this.file)) {
			try {
				this.data = readJson(this.file) ?? {};
				loaded = true;
			} catch (err) {
				this.quarantine(this.file, err);
			}
		} else {
			// migration that only occurs if the new preferences file doesnt exist
			const legacy = path.join(userDataDir, LEGACY_FILE);
			if (fs.existsSync(legacy)) {
				try {
					const { version, state } = readJson(legacy) ?? {};
					this.data = { version, state };
					this.dirty = true;
					log.info(`Migrated preferences from "${legacy}"`);
				} catch (err) {
					log.error(`Unable to migrate "${legacy}": ${err}`);
				}
			}
		}

		this.backupIfDue();

		if (this.dirty || (!loaded && !fs.existsSync(this.file))) {
			this.flush();
		}

		if (!this.exitHookInstalled) {
			this.exitHookInstalled = true;
			process.on("exit", () => {
				if (this.dirty) {
					this.flush();
				}
			});
		}

		return this.data;
	}

	get(): PreferencesData {
		return this.data;
	}

	replace(data: PreferencesData) {
		this.data = { version: data.version, state: data.state };
		this.dirty = true;

		if (this.timer) {
			clearTimeout(this.timer);
		}
		this.timer = setTimeout(() => this.flush(), WRITE_DEBOUNCE_MS);
		// don't keep the process alive just for a pending write
		this.timer.unref?.();
	}

	flush() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		if (!this.file) {
			return false;
		}

		try {
			writeFileAtomicSync(this.file, JSON.stringify(this.data, null, 2));
			this.dirty = false;
			return true;
		} catch (err) {
			log.error(`Unable to write "${this.file}": ${err}`);
			return false;
		}
	}

	private quarantine(file: string, err: unknown) {
		const backup = `${file}.corrupt-${Date.now()}.bak`;
		log.error(`"${file}" is unreadable (${err}); moving it to "${backup}"`);
		try {
			fs.copyFileSync(file, backup);
		} catch (copyErr) {
			log.error(`Unable to back up corrupt preferences: ${copyErr}`);
		}
		this.data = {};
		// rewrite the unreadable file so it isn't re-quarantined on every start
		this.dirty = true;
	}

	private isTimeToBackup(lastBackupTime: number, frequency: BackupFrequency) {
		if (frequency === "On Update") {
			const saved = this.data.version;
			return !!saved && semver.valid(saved) !== null
				? semver.lt(saved, pkg.version)
				: false;
		}

		const interval = INTERVALS[frequency];
		if (!interval) {
			throw new Error(`Unknown backup frequency: "${frequency}"`);
		}
		return Date.now() - lastBackupTime >= interval;
	}

	// backup settings
	private backupIfDue() {
		const workspace = this.data.state?.workspace;
		if (!workspace) {
			return;
		}

		try {
			const lastBackupTime = workspace.lastBackupTime ?? 0;
			const frequency: BackupFrequency = workspace.backupFreq ?? "On Update";
			if (!this.isTimeToBackup(lastBackupTime, frequency)) {
				return;
			}

			workspace.lastBackupTime = Date.now();
			this.dirty = true;

			const backupLoc: string = workspace.backupLoc ?? "";
			const directory =
				backupLoc !== "" && fs.existsSync(backupLoc) ? backupLoc : this.dir;
			const stamp = new Date().toISOString().replaceAll(":", "-");
			const backupPath = path.join(directory, `preferences-backup-${stamp}.json`);

			fs.writeFileSync(
				backupPath,
				JSON.stringify({ state: this.data.state, version: pkg.version }, null, 2),
			);

			this.pruneBackups(directory);
		} catch (err) {
			log.error(`Preferences backup failed: ${err}`);
		}
	}

	// keep only the newest MAX_BACKUPS
	private pruneBackups(directory: string) {
		let stale: string[];
		try {
			stale = fs
				.readdirSync(directory)
				.filter((f) => BACKUP_PATTERN.test(f))
				.sort()
				.slice(0, -MAX_BACKUPS);
		} catch (err) {
			log.error(`Unable to prune preference backups in "${directory}": ${err}`);
			return;
		}

		for (const f of stale) {
			try {
				fs.unlinkSync(path.join(directory, f));
			} catch (err) {
				log.error(`Unable to delete old backup "${f}": ${err}`);
			}
		}
	}
}

const preferencesStore = new PreferencesStore();

export default preferencesStore;
