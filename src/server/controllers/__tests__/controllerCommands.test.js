import {
	FIRMWARES,
	useControllerFixture,
} from "../test-support/controllerFixture";
import {
	CYCLE_START,
	FEED_HOLD,
	FILE_UNLOAD,
	HOMING,
	MACRO_LOAD,
	MACRO_RUN,
	METRIC_UNITS,
	SLEEP,
} from "../../../app/src/constants";

// Contract coverage through public dispatch, with real Feeder/Sender state.
describe.each(FIRMWARES)("%s command dispatch", (firmware, Controller) => {
	const f = useControllerFixture(Controller);
	let c;
	beforeEach(() => {
		c = f.controller;
	});

	test.each([
		["statusreport", "?", null],
		["feedhold", "!", FEED_HOLD],
		["cyclestart", "~", CYCLE_START],
		["sleep", "$SLP\n", SLEEP],
		["populateConfig", "$$\n", null],
	])(
		"%s writes the protocol command and triggers its event",
		(command, wire, event) => {
			const trigger = jest.spyOn(c.event, "trigger");
			c.command(command);
			expect(f.writes()).toEqual([wire]);
			if (event) expect(trigger).toHaveBeenCalledWith(event);
			else expect(trigger).not.toHaveBeenCalled();
		},
	);

	test.each([undefined, "X"])(
		"homing preserves axis handling for %p",
		(axis) => {
			const trigger = jest.spyOn(c.event, "trigger");
			c.command("homing", axis);
			expect(f.writes()).toEqual([
				firmware === "grblHAL" && axis ? "$HX\n" : "$H\n",
			]);
			expect(c.homingStarted).toBe(true);
			expect(c.state.status.activeState).toBe("Home");
			expect(trigger).toHaveBeenCalledWith(HOMING);
			expect(f.events("controller:state")).toEqual([[firmware, c.state]]);
		},
	);

	test.each([
		[0, "\x95"],
		[100, "\x95"],
		[50, "\x96"],
		[25, "\x97"],
		[75, null],
	])("rapidOverride %i emits only its supported byte", (value, wire) => {
		c.command("rapidOverride", value);
		expect(f.writes()).toEqual(wire ? [wire] : []);
	});

	test.each([
		["feedOverride", 100, [0x90]],
		["feedOverride", 112, [0x91, 0x93, 0x93]],
		["feedOverride", 89, [0x92, 0x94]],
		["spindleOverride", 100, [0x99]],
		["spindleOverride", 112, [0x9a, 0x9c, 0x9c]],
		["spindleOverride", 89, [0x9b, 0x9d]],
		["spindleOverride", 0, Array(9).fill(0x9b)],
		["spindleOverride", 250, Array(13).fill(0x9a)],
	])("%s %i queues ordered override bytes", async (command, value, bytes) => {
		c.state.status.ov = [100, 100, 100];
		c.sender.setEstimatedTime(112);
		c.command(command, value);
		expect(f.immediateWrites()).toEqual([]);
		await jest.advanceTimersByTimeAsync(1000);
		expect(f.immediateWrites()).toEqual(
			bytes.map((byte) => String.fromCharCode(byte)),
		);
		if (command === "feedOverride") {
			expect(c.sender.state.ovF).toBe(value);
			expect(c.sender.state.remainingTime).toBeCloseTo(112 / (value / 100));
		}
	});

	test("gcode splits lines, preserves context, and queues behind a pending line", () => {
		c.feeder.feed(["G0 X0"]);
		c.feeder.state.pending = true;
		const context = { marker: "macro" };
		c.command("gcode", ["G1 X1\r\n\nG1 X2", "   ", "G1 X3"], context);
		expect(c.feeder.state.queue).toEqual([
			{ command: "G0 X0", context: {} },
			...["G1 X1", "G1 X2", "G1 X3"].map((command) => ({ command, context })),
		]);
		expect(f.writes()).toEqual([]);
	});

	test("feeder:feed sends the first line and waits for an acknowledgment", () => {
		c.command("feeder:feed", ["G1 X1 F100", "G1 X2"]);
		expect(f.writes()).toEqual(["G1 X1 F100\n"]);
		expect(c.feeder.state.outstanding).toBe(1);
		c.runner.parse("ok");
		expect(f.writes()).toEqual(["G1 X1 F100\n", "G1 X2\n"]);
		expect(c.feeder.state.outstanding).toBe(1);
	});

	test.each(["G20", "G21", undefined])(
		"gcode:safe restores units from %p",
		(units) => {
			c.state.parserstate.modal.units = units;
			c.feeder.hold();
			c.command("gcode:safe", ["G1 X1"], "G21");
			expect(c.feeder.state.queue.map(({ command }) => command)).toEqual(
				units === "G20"
					? ["G21", "G1 X1", "G20"]
					: units === "G21"
						? ["G1 X1"]
						: [],
			);
		},
	);

	test.each([
		["lasertest:off", [], ["M5S0"]],
		["laserpower:change", [25, 800], ["S200"]],
		["spindlespeed:change", [12000], ["S12000"]],
	])("%s queues the requested output", (command, args, expected) => {
		c.feeder.hold();
		c.command(command, ...args);
		expect(c.feeder.state.queue.map(({ command }) => command)).toEqual(
			expected,
		);
	});

	test.each([0, 2])(
		"lasertest:on uses the firmware's power setting, duration %i",
		(duration) => {
			c.runner.settings.settings = { $30: "800", $730: "1200" };
			c.feeder.hold();
			c.command("lasertest:on", 25, duration);
			const power = firmware === "Grbl" ? "200.00" : "300.00";
			expect(c.feeder.state.queue.map(({ command }) => command)).toEqual([
				`G1F1 M3 S${power}`,
				...(duration ? ["G4P2", "M5 S0"] : []),
			]);
			expect(c.state.parserstate.modal.spindle).toBe("M3");
		},
	);

	test("macro:run preserves context and calls the callback once", () => {
		f.config.macros = [{ id: "m", name: "Probe", content: "G1 X1" }];
		c.feeder.hold();
		const context = { probe: true };
		const callback = jest.fn();
		const trigger = jest.spyOn(c.event, "trigger");
		c.command("macro:run", "m", context, callback);
		expect(c.feeder.state.queue).toEqual([{ command: "G1 X1", context }]);
		expect(trigger).toHaveBeenCalledWith(MACRO_RUN);
		expect(callback.mock.calls).toEqual([[null]]);
	});

	test.each(["macro:run", "macro:load"])(
		"%s supports omitted context and ignores unknown ids",
		(command) => {
			f.config.macros = [{ id: "m", name: "Probe", content: "G1 X1" }];
			c.feeder.hold();
			const callback = jest.fn();
			c.command(command, "missing", callback);
			expect(callback).not.toHaveBeenCalled();
			expect(f.writes()).toEqual([]);
			c.command(command, "m", callback);
			expect(callback).toHaveBeenCalledTimes(1);
			expect(callback.mock.calls[0][0]).toBeNull();
			if (command === "macro:load") expect(c.sender.state.name).toBe("Probe");
			else expect(c.feeder.state.queue[0].context).toEqual({});
		},
	);

	test("macro:load preserves its name and context through the firmware load signature", () => {
		f.config.macros = [{ id: "m", name: "Probe", content: "G1 X1" }];
		const trigger = jest.spyOn(c.event, "trigger");
		const context = { offset: 3 };
		const callback = jest.fn();
		c.command("macro:load", "m", context, callback);
		expect(c.sender.state.name).toBe("Probe");
		expect(c.sender.getContext()).toEqual(context);
		expect(callback).toHaveBeenCalledWith(
			null,
			expect.objectContaining({ name: "Probe", context }),
		);
		expect(trigger).toHaveBeenCalledWith(MACRO_LOAD);
	});

	test("gcode:unload stops the workflow, clears the job, and notifies the engine and UI", () => {
		c.sender.load("job.nc", "G1 X1");
		c.workflow.start();
		const trigger = jest.spyOn(c.event, "trigger");
		c.command("gcode:unload");
		expect(c.workflow.state).toBe("idle");
		expect(c.sender.state.name).toBe("");
		expect(c.sender.state.lines).toEqual([]);
		expect(f.engine.unload).toHaveBeenCalledTimes(1);
		expect(f.events("file:unload")).toEqual([[]]);
		expect(trigger).toHaveBeenCalledWith(FILE_UNLOAD);
	});

	test("toolchange:context pins replace versus merge behavior", () => {
		c.toolChangeContext = { preHook: "M5", mappings: { 1: 2 } };
		c.command("toolchange:context", { postHook: "M3" });
		expect(c.toolChangeContext).toEqual(
			firmware === "Grbl"
				? { postHook: "M3" }
				: { preHook: "M5", mappings: { 1: 2 }, postHook: "M3" },
		);
	});

	test("toolchange:pre and toolchange:post enqueue the hooks and completion markers", () => {
		c.toolChangeContext = { preHook: "M5", postHook: "M3", skipDialog: false };
		c.feeder.hold();
		c.command("toolchange:pre");
		expect(c.feeder.state.queue.map(({ command }) => command)).toEqual([
			"G4 P1",
			"M5",
			"%pre_complete ;",
		]);
		c.feeder.clear();
		c.command("toolchange:post");
		expect(f.writes()).toEqual(["~"]);
		expect(c.feeder.state.queue.map(({ command }) => command)).toEqual([
			"G4 P1",
			"M3",
			"%toolchange_complete",
		]);
	});

	test("wizard:start waits for idle and wizard:step completes once", () => {
		const addInterval = jest
			.spyOn(c.toolChanger, "addInterval")
			.mockImplementation(() => {});
		c.feeder.hold();
		c.command("wizard:start", "G1 X1");
		expect(c.feeder.state.queue).toEqual([]);
		addInterval.mock.calls[0][0]();
		expect(c.feeder.state.queue[0].command).toBe("G1 X1");
		c.command("wizard:step", 2, 3);
		c.feeder.emit("complete");
		c.feeder.emit("complete");
		expect(f.events("wizard:next")).toEqual([[2, 3]]);
	});

	test("settings and machine profile commands update only the requested values", () => {
		f.values.preferences = { spindleDelay: 2, showLineWarnings: true };
		c.command("settings:updated", { spindleDelay: 4 });
		expect(f.values.preferences).toEqual({
			spindleDelay: 4,
			showLineWarnings: true,
		});
		c.command("machineprofile:load", { name: "Mill" });
		c.command("firmware:grabMachineProfile");
		expect(f.events("sender:status")).toEqual([[{ name: "Mill" }]]);
		c.command("firmware:recievedProfiles", ["Mill"]);
		expect(f.events("task:finish")).toEqual([[["Mill"]]]);
		c.command("checkStateUpdate");
		expect(f.events("controller:state")).toEqual([[firmware, c.state]]);
	});

	test("updateEstimateData updates the real Sender estimates", () => {
		c.command("updateEstimateData", { estimates: [1, 2], estimatedTime: 3 });
		expect(c.sender.state.estimateData).toEqual([1, 2]);
		expect(c.sender.state.estimatedTime).toBe(3);
		expect(c.sender.state.remainingTime).toBe(3);
	});

	test.each([
		[
			"jog:start",
			"start",
			[{ x: 1 }],
			{ axes: { x: 1 }, feedrate: 1000, units: METRIC_UNITS },
		],
		[
			"jog:update",
			"update",
			[{ y: -1 }, 500],
			{ axes: { y: -1 }, feedrate: 500 },
		],
		[
			"jog:feed",
			"feed",
			[{ z: 1 }, 300],
			{ axes: { z: 1 }, feedrate: 300, units: METRIC_UNITS },
		],
	])(
		"%s passes axis, feed, and units to JogStreamer",
		(command, method, args, expected) => {
			const spy = jest
				.spyOn(c.jogStreamer, method)
				.mockImplementation(() => {});
			c.command(command, ...args);
			expect(spy).toHaveBeenCalledWith(expected);
		},
	);

	test.each(["jog:stop", "jog:cancel"])(
		"%s cancels motion with 0x85",
		(command) => {
			const method = command === "jog:stop" ? "stop" : "abort";
			const spy = jest
				.spyOn(c.jogStreamer, method)
				.mockImplementation(() => {});
			c.command(command);
			expect(spy).toHaveBeenCalledTimes(1);
			if (method === "abort") expect(spy).toHaveBeenCalledWith("cancel");
			expect(f.writes()).toEqual(["\x85"]);
		},
	);

	test("a conflicting command aborts the jog before claiming the serial link", () => {
		const order = [];
		jest.spyOn(c.jogStreamer, "isActive").mockReturnValue(true);
		jest
			.spyOn(c.jogStreamer, "abort")
			.mockImplementation((reason) => order.push(reason));
		f.connection.write.mockImplementation((data) => order.push(data));
		c.command("populateConfig");
		expect(order).toEqual(["command:populateConfig", "$$\n"]);
	});

	test("status polling and unknown commands leave an active jog alone", () => {
		jest.spyOn(c.jogStreamer, "isActive").mockReturnValue(true);
		const abort = jest
			.spyOn(c.jogStreamer, "abort")
			.mockImplementation(() => {});
		c.command("statusreport");
		c.command("not-a-command");
		expect(abort).not.toHaveBeenCalled();
		expect(f.writes()).toEqual(["?"]);
	});
});
