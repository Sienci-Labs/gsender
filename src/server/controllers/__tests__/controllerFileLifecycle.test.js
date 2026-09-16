import {
	FIRMWARES,
	useControllerFixture,
} from "../test-support/controllerFixture";
import { FILE_TYPE } from "../../../app/src/constants";

const JOB =
	"G21\nG90\nG1 X10 Y20 Z-2 F300\nM3 S12000\nG2 X20 Y20 I5 J0\nG1 X30";

describe.each(FIRMWARES)(
	"%s file loading and start-from-line",
	(firmware, Controller) => {
		const f = useControllerFixture(Controller);
		let c;
		beforeEach(() => {
			c = f.controller;
		});
		const nameArgument = () =>
			firmware === "Grbl" ? { name: "job.nc" } : "job.nc";
		const queued = () => c.feeder.state.queue.map(({ command }) => command);

		test.each([false, true])(
			"gcode:load supports callback shorthand=%p",
			(shorthand) => {
				const callback = jest.fn();
				const context = { offset: 7 };
				c.workflow.start();
				if (shorthand) c.command("gcode:load", nameArgument(), JOB, callback);
				else c.command("gcode:load", nameArgument(), JOB, context, callback);
				expect(c.sender.state.name).toBe("job.nc");
				expect(c.sender.getContext()).toEqual(shorthand ? {} : context);
				expect(c.sender.state.gcode).toBe(
					JOB +
						(firmware === "Grbl"
							? "\n%wait ; Wait for the planner to empty"
							: "\n"),
				);
				expect(c.workflow.state).toBe("idle");
				expect(callback.mock.calls).toEqual([[null, c.sender.toJSON()]]);
				expect(f.writes()).toEqual([]);
			},
		);

		test("a rejected Sender load calls back with an error without stopping Workflow", () => {
			c.workflow.start();
			jest.spyOn(c.sender, "load").mockReturnValue(false);
			const callback = jest.fn();
			c.command("gcode:load", nameArgument(), JOB, callback);
			expect(callback.mock.calls).toEqual([
				[new Error("Invalid G-code: name=job.nc")],
			]);
			expect(c.workflow.state).toBe("running");
		});

		test.each(["idle", "running", "paused"])(
			"loadFile refresh while %s",
			(state) => {
				c.sender.load("old.nc", "G1 X1");
				if (state !== "idle") c.workflow.start();
				if (state === "paused") c.workflow.pause();
				c.loadFile(JOB, { name: "job.nc" }, true);
				expect(c.sender.state.name).toBe(
					state === "idle" ? "job.nc" : "old.nc",
				);
				expect(c.workflow.state).toBe(state);
			},
		);

		test.each([20240101, 20250627])(
			"spindle delay respects firmware version %i",
			(semver) => {
				f.values.preferences = { spindleDelay: 2 };
				c.runner.settings.version = { semver };
				c.loadFile("M3 S12000\nG1 X1 F100", { name: "job.nc" });
				const delayed = firmware === "Grbl" || semver < 20250627;
				expect(c.sender.state.lines[0]).toBe(
					delayed ? "M3 S12000 G4 P2" : "M3 S12000",
				);
			},
		);

		test("an unrelated G4 suppresses Grbl delay insertion but not grblHAL's", () => {
			f.values.preferences = { spindleDelay: 2 };
			c.runner.settings.version = { semver: 20240101 };
			c.loadFile("G4 P1\nM3 S12000", { name: "job.nc" });
			expect(c.sender.state.lines[1]).toBe(
				firmware === "Grbl" ? "M3 S12000" : "M3 S12000 G4 P2",
			);
		});

		test("loading a job clears tool mappings only on grblHAL", () => {
			c.toolChangeContext = { mappings: { 1: 2 }, postHook: "M3" };
			c.loadFile(JOB, { name: "job.nc" });
			expect(c.toolChangeContext).toEqual({
				mappings: firmware === "Grbl" ? { 1: 2 } : {},
				postHook: "M3",
			});
		});

		test.each([
			["G1 A10 Y20", FILE_TYPE.FOUR_AXIS],
			["G1 A10", FILE_TYPE.ROTARY],
			["G1 X1 (A10 Y20)", null],
		])("file-type classification for %s", (gcode, type) => {
			c.loadFile(gcode, { name: "job.nc" });
			expect(f.events("filetype")).toEqual(
				firmware === "Grbl" && type ? [[type]] : [],
			);
		});

		test("start-from-line preserves the complete arc/spindle restoration sequence", () => {
			c.sender.load("job.nc", JOB);
			c.feeder.hold();
			c.command("gcode:start", 5, 10, 3);
			expect(queued()).toEqual([
				"%global.state.workspace=modal.wcs",
				"G0 G90 G21 Z13",
				firmware === "Grbl" ? "G21 M3 F300 S12000" : "M3 S12000",
				"G0 G90 G21 X20.000 Y20.000",
				"G0 G90 G21 Z-2.000",
				"G21 G90 G91.1 G54 G17  ",
				...(firmware === "Grbl"
					? ["G2", "G4 P0"]
					: ["F300", "G2 X20.000 J0 F300"]),
				"%_GCODE_START",
			]);
			expect(c.sender.state.sent).toBe(5);
			expect(c.sender.state.received).toBe(5);
			expect(c.workflow.state).toBe("idle");
			expect(f.writes()).toEqual([]);
		});

		test.each([
			["G21", 200],
			["G20", 8],
		])("start-from-line supplies a fallback feed in %s", (units, feed) => {
			c.sender.load("job.nc", `${units}\nG1 X1\nG1 X2`);
			c.feeder.hold();
			c.command("gcode:start", 2, 10);
			expect(queued()).toContain(`${units} F${feed}`);
			if (firmware === "grblHAL") expect(queued()).toContain(`F${feed}`);
			expect(queued()).toContain("G0 G90 G21 Z20");
		});

		test.each(["G54", "G56"])(
			"start-from-line keeps explicit workspace %s or restores the selected one",
			(wcs) => {
				c.state.parserstate.modal.wcs = "G55";
				c.sender.load("job.nc", `${wcs}\nG1 X1 F100\nG1 X2`);
				c.feeder.hold();
				c.command("gcode:start", 2, 10);
				expect(queued()).toContain(
					`G21 G90 G91.1 ${wcs === "G54" ? "G55" : "G56"} G17  `,
				);
			},
		);

		test("start-from-line uses the per-command spindle delay only on Grbl", () => {
			f.values.preferences = { spindleDelay: 2 };
			c.sender.load("job.nc", JOB);
			c.feeder.hold();
			c.command("gcode:start", 5, 10, 3, 7);
			expect(queued()).toContain(firmware === "Grbl" ? "G4 P7" : "G4 P2");
		});

		test.each([0, 99])("start line %i falls back to the beginning", (line) => {
			c.sender.load("job.nc", JOB);
			const next = jest.spyOn(c.sender, "next").mockImplementation(() => {});
			c.command("gcode:start", line, 10);
			expect(c.sender.state.sent).toBe(0);
			expect(c.workflow.state).toBe("running");
			expect(next).toHaveBeenCalledWith({ startFromLine: true });
		});

		test("start-from-line retains rotary position modulo 360 and both coolant modes", () => {
			c.sender.load("job.nc", "G21\nG1 A450 F100\nM7\nM8\nG1 X1");
			c.feeder.hold();
			c.command("gcode:start", 4, 10);
			expect(queued()).toContain("G0 G90 G21 A90.000");
			expect(queued()).toContain("G21 G90 G91.1 G54 G17 M8 M7");
		});

		test.each([
			[false, true, true],
			[true, false, true],
			[true, true, false],
			[true, true, true],
		])(
			"tool restoration with ATC=%p, M6=%p, mapping=%p",
			(atc, m6, mapping) => {
				c.settings.info = { NEWOPT: { ATC: atc ? "1" : "0" } };
				c.toolChangeContext.mappings = mapping ? { 2: 7 } : {};
				c.sender.load("job.nc", `T2\n${m6 ? "M6" : "G90"}\nG1 X1 F100\nG1 X2`);
				c.feeder.hold();
				c.command("gcode:start", 3, 10);
				expect(queued().filter((line) => line.startsWith("M6"))).toEqual(
					firmware === "grblHAL" && atc && m6
						? [mapping ? "M6 T7" : "M6 T2"]
						: [],
				);
			},
		);
	},
);
