import {
	FIRMWARES,
	useControllerFixture,
} from "../test-support/controllerFixture";
import {
	PROGRAM_START,
	PROGRAM_PAUSE,
	PROGRAM_RESUME,
	PROGRAM_END,
} from "../../../app/src/constants";

// These tests describe current behavior, including unresolved firmware differences.
describe.each(FIRMWARES)(
	"%s workflow and event wiring",
	(firmware, Controller) => {
		const f = useControllerFixture(Controller);
		let c;
		beforeEach(() => {
			c = f.controller;
		});

		test("workflow start aborts jogging then rewinds Sender", () => {
			c.sender.load("job.nc", "G1 X1\nG1 X2");
			c.sender.setStartLine(1);
			c.sender.hold();
			const order = [];
			jest
				.spyOn(c.jogStreamer, "abort")
				.mockImplementation((reason) => order.push(reason));
			const rewind = c.sender.rewind.bind(c.sender);
			jest.spyOn(c.sender, "rewind").mockImplementation(() => {
				const result = rewind();
				order.push([c.sender.state.sent, c.sender.state.hold]);
				return result;
			});
			c.workflow.start();
			expect(order).toEqual(["workflow", [0, false]]);
			expect(c.workflow.state).toBe("running");
			expect(f.events("workflow:state")).toEqual([["running"]]);
			c.workflow.start();
			expect(f.events("workflow:state")).toHaveLength(1);
		});

		test.each([undefined, { err: "probe failure" }])(
			"pause holds Sender with reason %p",
			(reason) => {
				c.workflow.start();
				const abort = jest.spyOn(c.jogStreamer, "abort");
				if (reason) c.workflow.pause(reason);
				else c.workflow.pause();
				expect(c.workflow.state).toBe("paused");
				expect(c.sender.state.hold).toBe(true);
				expect(c.sender.state.holdReason).toEqual(reason);
				expect(c.timePaused).toBe(Date.now());
				expect(abort).toHaveBeenCalledWith("workflow");
			},
		);

		test("resume clears Feeder before unholding Sender and passes elapsed pause time", async () => {
			c.workflow.start();
			c.workflow.pause();
			c.feeder.feed(["G1 X9"]);
			c.feeder.hold();
			const feederUnhold = jest.spyOn(c.feeder, "unhold");
			const next = jest
				.spyOn(c.sender, "next")
				.mockImplementation((options) => {
					expect(c.feeder.state.queue).toEqual([]);
					expect(c.sender.state.hold).toBe(false);
					expect(options).toEqual({ timePaused: 250 });
				});
			await jest.advanceTimersByTimeAsync(250);
			c.workflow.resume();
			expect(next).toHaveBeenCalledTimes(1);
			expect(feederUnhold).toHaveBeenCalledTimes(
				firmware === "grblHAL" ? 1 : 0,
			);
			expect(c.workflow.state).toBe("running");
		});

		test("stop resets pending Feeder work and rewinds Sender", () => {
			c.sender.load("job.nc", "G1 X1\nG1 X2");
			c.workflow.start();
			c.sender.setStartLine(1);
			c.feeder.feed(["G1 X9"]);
			c.feeder.state.outstanding = 1;
			c.workflow.stop();
			expect(c.sender.state.sent).toBe(0);
			expect(c.sender.state.received).toBe(0);
			expect(c.feeder.state.queue).toEqual([]);
			expect(c.feeder.state.outstanding).toBe(0);
			expect(c.workflow.state).toBe("idle");
		});

		test.each(["gcode:start", "start"])(
			"%s starts at the beginning without a hook",
			(command) => {
				c.sender.load("job.nc", "G1 X1 F100\nG1 X2");
				c.sender.setStartLine(1);
				const next = jest.spyOn(c.sender, "next").mockImplementation(() => {});
				c.command(command);
				expect(c.workflow.state).toBe("running");
				expect(c.sender.state.sent).toBe(0);
				expect(next).toHaveBeenCalledWith({ startFromLine: true });
				expect(f.events("job:start")).toEqual([[]]);
			},
		);

		test("start hook defers Sender until Feeder completes, and fires once", () => {
			jest
				.spyOn(c.event, "hasEnabledEvent")
				.mockImplementation((event) => event === PROGRAM_START);
			const trigger = jest.spyOn(c.event, "trigger");
			const next = jest.spyOn(c.sender, "next").mockImplementation(() => {});
			c.command("gcode:start");
			expect(c.workflow.state).toBe("idle");
			expect(next).not.toHaveBeenCalled();
			expect(trigger).toHaveBeenCalledWith(PROGRAM_START);
			c.feeder.emit("complete");
			c.feeder.emit("complete");
			expect(c.workflow.state).toBe("running");
			expect(next).toHaveBeenCalledTimes(1);
			expect(c.feederCB).toBeNull();
		});

		test.each(["gcode:pause", "pause"])(
			"%s holds immediately and sends ! after 100 ms",
			async (command) => {
				c.workflow.start();
				c.command(command);
				expect(c.sender.state.hold).toBe(true);
				expect(c.workflow.state).toBe("paused");
				expect(f.writes()).toEqual([]);
				await jest.advanceTimersByTimeAsync(99);
				expect(f.writes()).toEqual([]);
				await jest.advanceTimersByTimeAsync(1);
				expect(f.writes()).toEqual(["!"]);
			},
		);

		test("pause hook replaces the delayed feed-hold byte", async () => {
			c.workflow.start();
			jest.spyOn(c.event, "hasEnabledEvent").mockReturnValue(true);
			const trigger = jest.spyOn(c.event, "trigger");
			c.command("gcode:pause");
			await jest.advanceTimersByTimeAsync(100);
			expect(c.workflow.state).toBe("paused");
			expect(trigger).toHaveBeenCalledWith(PROGRAM_PAUSE);
			expect(f.writes()).toEqual([]);
		});

		test.each(["gcode:resume", "resume"])(
			"%s waits 1000 ms after ~ before resuming Sender",
			async (command) => {
				c.workflow.start();
				c.workflow.pause();
				const next = jest.spyOn(c.sender, "next").mockImplementation(() => {});
				c.command(command);
				expect(f.writes()).toEqual(["~"]);
				await jest.advanceTimersByTimeAsync(999);
				expect(c.workflow.state).toBe("paused");
				expect(next).not.toHaveBeenCalled();
				await jest.advanceTimersByTimeAsync(1);
				expect(c.workflow.state).toBe("running");
				expect(next).toHaveBeenCalledWith({ timePaused: 1000 });
			},
		);

		test.each([false, true])(
			"resume hook with ignoreEvents=%p",
			async (ignoreEvents) => {
				c.workflow.start();
				c.workflow.pause();
				jest.spyOn(c.event, "hasEnabledEvent").mockReturnValue(true);
				const trigger = jest.spyOn(c.event, "trigger");
				const next = jest.spyOn(c.sender, "next").mockImplementation(() => {});
				c.command("gcode:resume", ignoreEvents);
				if (ignoreEvents) {
					expect(trigger).not.toHaveBeenCalled();
					await jest.advanceTimersByTimeAsync(1000);
				} else {
					expect(trigger).toHaveBeenCalledWith(PROGRAM_RESUME);
					expect(f.writes()).toEqual([]);
					c.feeder.emit("complete");
					c.feeder.emit("complete");
				}
				expect(f.writes()).toEqual(["~"]);
				expect(next).toHaveBeenCalledTimes(1);
				expect(c.workflow.state).toBe("running");
			},
		);

		test.each(["gcode:stop", "stop"])(
			"%s without force ends the workflow without reset bytes",
			(command) => {
				c.workflow.start();
				const trigger = jest.spyOn(c.event, "trigger");
				c.command(command);
				expect(c.workflow.state).toBe("idle");
				expect(f.events("job:stop")).toEqual([[]]);
				expect(trigger).toHaveBeenCalledWith(PROGRAM_END);
				expect(f.writes()).toEqual([]);
			},
		);

		test.each(["G54", "G55"])(
			"force stop resets before ending and restores %s",
			async (wcs) => {
				c.workflow.start();
				c.state.status.activeState = "Run";
				c.state.parserstate.modal.wcs = wcs;
				const trigger = jest.spyOn(c.event, "trigger");
				c.command("gcode:stop", { force: true });
				const prefix = firmware === "Grbl" ? ["!"] : ["\x19", "!"];
				expect(f.writes()).toEqual(prefix);
				expect(trigger).not.toHaveBeenCalled();
				await jest.advanceTimersByTimeAsync(699);
				expect(f.writes()).toEqual(prefix);
				await jest.advanceTimersByTimeAsync(1);
				expect(f.writes()).toEqual([...prefix, "\x18"]);
				if (wcs !== "G54") {
					expect(trigger).not.toHaveBeenCalled();
					await jest.advanceTimersByTimeAsync(200);
					expect(f.writes()).toEqual([...prefix, "\x18", "G55\n"]);
				}
				expect(trigger).toHaveBeenCalledWith(PROGRAM_END);
			},
		);

		if (firmware === "grblHAL")
			test("stop cancels its pending automatic resume", async () => {
				const resume = jest.fn();
				c.programResumeTimeout = setTimeout(resume, 1000);
				c.command("gcode:stop");
				await jest.advanceTimersByTimeAsync(1000);
				expect(resume).not.toHaveBeenCalled();
			});

		test.each(["idle", "running"])("feeder:start from %s", async (state) => {
			if (state === "running") c.workflow.start();
			c.feeder.hold();
			c.feeder.feed(["G1 X1 F100"]);
			c.command("feeder:start");
			if (state === "running") {
				await jest.advanceTimersByTimeAsync(1000);
				expect(f.writes()).toEqual([]);
				expect(c.feeder.state.hold).toBe(true);
			} else {
				expect(f.writes()).toEqual(["~"]);
				await jest.advanceTimersByTimeAsync(999);
				expect(c.feeder.state.hold).toBe(true);
				await jest.advanceTimersByTimeAsync(1);
				expect(f.writes()).toEqual(["~", "G1 X1 F100\n"]);
				expect(c.feeder.state.hold).toBe(false);
			}
		});

		test("feeder:stop pins firmware-specific workflow and soft-stop behavior", async () => {
			c.workflow.start();
			c.feeder.feed(["G1 X1"]);
			c.command("feeder:stop");
			expect(c.feeder.state.queue).toEqual([]);
			expect(c.workflow.state).toBe(firmware === "Grbl" ? "running" : "idle");
			const prefix = firmware === "Grbl" ? [] : ["\x19"];
			expect(f.writes()).toEqual(prefix);
			await jest.advanceTimersByTimeAsync(100);
			expect(f.writes()).toEqual([...prefix, "~"]);
		});

		test("reset stops the workflow, clears the queue, and sends Ctrl-X", () => {
			c.workflow.start();
			c.feeder.feed(["G1 X1"]);
			c.command("reset");
			expect(c.workflow.state).toBe("idle");
			expect(c.feeder.state.queue).toEqual([]);
			expect(f.writes()).toEqual(["\x18"]);
		});

		test("unlock preserves the additional grblHAL soft stop", () => {
			c.feeder.feed(["G1 X1"]);
			c.command("unlock");
			expect(c.feeder.state.queue).toEqual([]);
			expect(f.writes()).toEqual(
				firmware === "Grbl" ? ["$X\n"] : ["$X\n", "\x19"],
			);
		});

		test("reset:limit pins unlock timing and grblHAL's complete status request", async () => {
			c.command("reset:limit");
			expect(f.writes()).toEqual(
				firmware === "Grbl" ? ["\x18", "$X\n"] : ["\x18"],
			);
			await jest.advanceTimersByTimeAsync(349);
			if (firmware === "grblHAL") expect(f.writes()).toEqual(["\x18"]);
			await jest.advanceTimersByTimeAsync(1);
			expect(f.writes()).toEqual(["\x18", "$X\n"]);
			expect(f.immediateWrites()).toEqual([]);
			await jest.advanceTimersByTimeAsync(500);
			expect(f.immediateWrites()).toEqual(firmware === "Grbl" ? [] : ["\x87"]);
		});

		test("gcode:test preserves the order of Feeder reset and Workflow start", () => {
			// Hold check-mode setup commands until the test invokes the completion event.
			c.feeder.hold();
			c.command("gcode:test");
			expect(c.feeder.state.queue.map(({ command }) => command)).toEqual([
				"%global.state.testWCS=modal.wcs",
				"$C",
			]);
			const order = [];
			jest
				.spyOn(c.feeder, "reset")
				.mockImplementation(() => order.push("reset"));
			c.workflow.on("start", () => order.push("start"));
			jest.spyOn(c.sender, "next").mockImplementation(() => order.push("next"));
			c.feeder.emit("complete");
			expect(order).toEqual(
				firmware === "Grbl"
					? ["start", "reset", "next"]
					: ["reset", "start", "next"],
			);
			expect(c.feederCB).toBeNull();
		});

		test.each(["idle", "running", "paused"])(
			"ok routes to the right queue while %s",
			(state) => {
				c.sender.load("job.nc", "G1 X1\nG1 X2");
				if (state !== "idle") c.workflow.start();
				if (state === "paused") c.workflow.pause();
				c.sender.state.sent = 2;
				const next = jest.spyOn(c.sender, "next").mockImplementation(() => {});
				const feederNext = jest
					.spyOn(c.feeder, "next")
					.mockImplementation(() => {});
				c.feeder.state.outstanding = 1;
				c.runner.parse("ok");
				expect(c.sender.state.received).toBe(state === "idle" ? 0 : 1);
				expect(c.feeder.state.outstanding).toBe(state === "idle" ? 0 : 1);
				expect(next).toHaveBeenCalledTimes(state === "idle" ? 0 : 1);
				expect(feederNext).toHaveBeenCalledTimes(state === "idle" ? 1 : 0);
			},
		);

		test("a parser-query acknowledgment never advances job or Feeder", () => {
			c.actionMask.queryParserState.reply = true;
			c.actionMask.replyParserState = true;
			c.parserStateEnabled = false;
			const senderAck = jest.spyOn(c.sender, "ack");
			const feederAck = jest.spyOn(c.feeder, "ack");
			c.runner.parse("ok");
			expect(senderAck).not.toHaveBeenCalled();
			expect(feederAck).not.toHaveBeenCalled();
			expect(c.actionMask.queryParserState.reply).toBe(false);
			expect(f.events("serialport:read")).toContainEqual(["ok"]);
		});

		test("JogStreamer consumes its own acknowledgments", () => {
			jest.spyOn(c.jogStreamer, "isActive").mockReturnValue(true);
			const ack = jest.spyOn(c.jogStreamer, "ack").mockReturnValue(true);
			const senderAck = jest.spyOn(c.sender, "ack");
			const feederAck = jest.spyOn(c.feeder, "ack");
			c.runner.parse("ok");
			expect(ack).toHaveBeenCalledTimes(1);
			expect(senderAck).not.toHaveBeenCalled();
			expect(feederAck).not.toHaveBeenCalled();
		});

		test("alarm reports identify the loaded job and pin the workflow difference", () => {
			c.sender.load("job.nc", "G1 X1\nG1 X2");
			c.workflow.start();
			if (firmware === "grblHAL")
				c.settings.alarms = { 1: { description: "Hard limit" } };
			c.runner.parse("ALARM:1");
			expect(f.events("error")[0][0]).toEqual(
				expect.objectContaining({
					code: 1,
					origin: "job.nc",
					line: "G1 X1",
					lineNumber: 0,
					controller: firmware,
				}),
			);
			expect(c.workflow.state).toBe(firmware === "Grbl" ? "running" : "idle");
		});
	},
);
