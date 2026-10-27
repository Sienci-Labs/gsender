import fs from "fs";
import os from "os";
import path from "path";

jest.mock("../../../lib/logger", () => () => ({
	error: jest.fn(),
	warn: jest.fn(),
	info: jest.fn(),
	debug: jest.fn(),
}));

import preferencesStore from "../preferencesStore";

const NEW_FILE = "gsender-preferences.json";
const LEGACY_FILE = "gsender-0.5.6.json";

const write = (dir: string, name: string, data: unknown) =>
	fs.writeFileSync(
		path.join(dir, name),
		typeof data === "string" ? data : JSON.stringify(data),
	);
const read = (dir: string, name: string) =>
	JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
const backups = (dir: string) =>
	fs.readdirSync(dir).filter((f) => f.startsWith("preferences-backup-"));

// Workspace settings that never trigger a backup, so tests opt in explicitly.
const quietState = (extra = {}) => ({
	workspace: {
		backupFreq: "Monthly",
		lastBackupTime: Date.now(),
		...extra,
	},
});

describe("preferencesStore", () => {
	let dir: string;

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "gsender-prefs-"));
	});

	afterEach(() => {
		jest.useRealTimers();
		fs.rmSync(dir, { recursive: true, force: true });
	});

	describe("load", () => {
		it("starts empty and creates the file when nothing exists", () => {
			expect(preferencesStore.load(dir)).toEqual({});
			expect(read(dir, NEW_FILE)).toEqual({});
		});

		it("migrates the legacy gsender-0.5.6.json and leaves it untouched", () => {
			const legacy = { version: "1.6.0", state: quietState({ units: "mm" }) };
			write(dir, LEGACY_FILE, legacy);

			expect(preferencesStore.load(dir)).toEqual(legacy);
			expect(read(dir, NEW_FILE)).toEqual(legacy);
			expect(read(dir, LEGACY_FILE)).toEqual(legacy);
		});

		it("starts empty when the legacy file is corrupt", () => {
			write(dir, LEGACY_FILE, "{not json");

			expect(preferencesStore.load(dir)).toEqual({});
		});

		it("prefers the new file once it exists", () => {
			const current = { version: "1.7.0", state: quietState({ units: "in" }) };
			write(dir, LEGACY_FILE, { version: "1.6.0", state: quietState() });
			write(dir, NEW_FILE, current);

			expect(preferencesStore.load(dir)).toEqual(current);
		});

		it("quarantines a corrupt file to a .corrupt-<ts>.bak and starts empty", () => {
			write(dir, NEW_FILE, "garbage");

			expect(preferencesStore.load(dir)).toEqual({});

			const bak = fs.readdirSync(dir).filter((f) => f.includes(".corrupt-"));
			expect(bak).toHaveLength(1);
			expect(fs.readFileSync(path.join(dir, bak[0]), "utf8")).toBe("garbage");
			expect(read(dir, NEW_FILE)).toEqual({});
		});
	});

	describe("replace", () => {
		it("updates memory immediately and writes atomically after the debounce", () => {
			jest.useFakeTimers();
			preferencesStore.load(dir);

			const next = { version: "1.7.0", state: quietState({ units: "in" }) };
			preferencesStore.replace(next);

			expect(preferencesStore.get()).toEqual(next);
			expect(read(dir, NEW_FILE)).toEqual({});

			jest.advanceTimersByTime(300);

			expect(read(dir, NEW_FILE)).toEqual(next);
			expect(fs.readdirSync(dir).filter((f) => f.endsWith(".tmp"))).toEqual([]);
		});

		it("coalesces rapid replaces into the last value", () => {
			jest.useFakeTimers();
			preferencesStore.load(dir);

			preferencesStore.replace({ version: "1", state: { a: 1 } });
			jest.advanceTimersByTime(100);
			preferencesStore.replace({ version: "1", state: { a: 2 } });
			jest.advanceTimersByTime(100);
			expect(read(dir, NEW_FILE)).toEqual({});

			jest.advanceTimersByTime(200);
			expect(read(dir, NEW_FILE).state).toEqual({ a: 2 });
		});

		it("flush writes pending data right away", () => {
			jest.useFakeTimers();
			preferencesStore.load(dir);
			preferencesStore.replace({ version: "1", state: { a: 1 } });

			preferencesStore.flush();

			expect(read(dir, NEW_FILE).state).toEqual({ a: 1 });
		});
	});

	describe("backups", () => {
		it("backs up and stamps lastBackupTime when the frequency has elapsed", () => {
			write(dir, NEW_FILE, {
				version: "1.7.0",
				state: { workspace: { backupFreq: "Daily", lastBackupTime: 0 } },
			});

			const data = preferencesStore.load(dir);

			expect(backups(dir)).toHaveLength(1);
			// backup uses the same { version, state } shape as the preferences file (not double-wrapped)
			const backup = read(dir, backups(dir)[0]);
			expect(backup.state.workspace).toBeDefined();
			expect(backup.state.state).toBeUndefined();
			expect(data.state.workspace.lastBackupTime).toBeGreaterThan(0);
			expect(read(dir, NEW_FILE).state.workspace.lastBackupTime).toBe(
				data.state.workspace.lastBackupTime,
			);
		});

		it("skips the backup when the last one is recent", () => {
			write(dir, NEW_FILE, {
				version: "1.7.0",
				state: { workspace: { backupFreq: "Daily", lastBackupTime: Date.now() } },
			});

			preferencesStore.load(dir);

			expect(backups(dir)).toHaveLength(0);
		});

		it("backs up on update when the saved version is older than the running one", () => {
			write(dir, NEW_FILE, {
				version: "0.0.1",
				state: { workspace: { backupFreq: "On Update", lastBackupTime: Date.now() } },
			});

			preferencesStore.load(dir);

			expect(backups(dir)).toHaveLength(1);
		});

		it("writes to workspace.backupLoc when it exists", () => {
			const backupLoc = fs.mkdtempSync(path.join(os.tmpdir(), "gsender-bak-"));
			try {
				write(dir, NEW_FILE, {
					version: "1.7.0",
					state: { workspace: { backupFreq: "Daily", lastBackupTime: 0, backupLoc } },
				});

				preferencesStore.load(dir);

				expect(backups(backupLoc)).toHaveLength(1);
				expect(backups(dir)).toHaveLength(0);
			} finally {
				fs.rmSync(backupLoc, { recursive: true, force: true });
			}
		});

		const seedBackups = (target: string) => {
			for (let day = 1; day <= 5; day++) {
				write(target, `preferences-backup-2020-01-0${day}T00-00-00.000Z.json`, {});
			}
		};

		it("keeps only the 3 newest backups", () => {
			seedBackups(dir);
			write(dir, NEW_FILE, {
				version: "1.7.0",
				state: { workspace: { backupFreq: "Daily", lastBackupTime: 0 } },
			});

			preferencesStore.load(dir);

			const kept = backups(dir).sort();
			expect(kept).toHaveLength(3);
			expect(kept.slice(0, 2)).toEqual([
				"preferences-backup-2020-01-04T00-00-00.000Z.json",
				"preferences-backup-2020-01-05T00-00-00.000Z.json",
			]);
		});

		it("ignores undated copies when choosing which backups to keep", () => {
			seedBackups(dir);
			write(dir, "preferences-backup-copy.json", {});
			write(dir, NEW_FILE, {
				version: "1.7.0",
				state: { workspace: { backupFreq: "Daily", lastBackupTime: 0 } },
			});

			preferencesStore.load(dir);

			expect(fs.existsSync(path.join(dir, "preferences-backup-copy.json"))).toBe(true);
			const dated = backups(dir)
				.filter((f) => f !== "preferences-backup-copy.json")
				.sort();
			expect(dated).toHaveLength(3);
			expect(dated.slice(0, 2)).toEqual([
				"preferences-backup-2020-01-04T00-00-00.000Z.json",
				"preferences-backup-2020-01-05T00-00-00.000Z.json",
			]);
		});

		it("leaves files that aren't preference backups alone", () => {
			seedBackups(dir);
			write(dir, "gsender-preferences.json.corrupt-1.bak", "x");
			write(dir, "notes.json", {});
			write(dir, NEW_FILE, {
				version: "1.7.0",
				state: { workspace: { backupFreq: "Daily", lastBackupTime: 0 } },
			});

			preferencesStore.load(dir);

			expect(fs.existsSync(path.join(dir, "gsender-preferences.json.corrupt-1.bak"))).toBe(true);
			expect(fs.existsSync(path.join(dir, "notes.json"))).toBe(true);
		});

		it("only prunes the folder the backup was written to", () => {
			const backupLoc = fs.mkdtempSync(path.join(os.tmpdir(), "gsender-bak-"));
			try {
				seedBackups(dir);
				seedBackups(backupLoc);
				write(dir, NEW_FILE, {
					version: "1.7.0",
					state: { workspace: { backupFreq: "Daily", lastBackupTime: 0, backupLoc } },
				});

				preferencesStore.load(dir);

				expect(backups(backupLoc)).toHaveLength(3);
				expect(backups(dir)).toHaveLength(5);
			} finally {
				fs.rmSync(backupLoc, { recursive: true, force: true });
			}
		});
	});
});

describe("preferencesStore exit hook", () => {
	let dir: string;
	let exitHandler: () => void;
	let store: typeof preferencesStore;
	let onSpy: jest.SpyInstance;

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "gsender-prefs-"));
		// The hook installs once per singleton, so use a fresh module instance.
		onSpy = jest.spyOn(process, "on").mockImplementation(((
			event: string,
			handler: () => void,
		) => {
			if (event === "exit") {
				exitHandler = handler;
			}
			return process;
		}) as never);
		jest.isolateModules(() => {
			store = require("../preferencesStore").default;
		});
	});

	afterEach(() => {
		onSpy.mockRestore();
		jest.useRealTimers();
		fs.rmSync(dir, { recursive: true, force: true });
	});

	it("does not rewrite the file on exit when nothing changed", () => {
		write(dir, NEW_FILE, { version: "1.7.0", state: quietState() });
		store.load(dir);
		const flush = jest.spyOn(store, "flush");

		exitHandler();

		expect(flush).not.toHaveBeenCalled();
	});

	it("flushes pending changes on exit", () => {
		jest.useFakeTimers();
		store.load(dir);
		store.replace({ version: "1.7.0", state: { a: 1 } });
		expect(read(dir, NEW_FILE)).toEqual({});

		exitHandler();

		expect(read(dir, NEW_FILE).state).toEqual({ a: 1 });
	});
});
