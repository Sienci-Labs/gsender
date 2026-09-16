import {
	FIRMWARES,
	useControllerFixture,
} from "../test-support/controllerFixture";

// Real parser -> runner -> controller listeners. Poll-loop behavior is separate.
describe.each(FIRMWARES)(
	"%s runner and transport events",
	(firmware, Controller) => {
		const f = useControllerFixture(Controller);
		let c;
		beforeEach(() => {
			c = f.controller;
		});

		test("raw data reaches plugins, and plugin failures do not interrupt parsing", () => {
			const feed = jest
				.spyOn(c.pluginParsers, "feed")
				.mockImplementation(() => {
					throw new Error("plugin failed");
				});
			const ack = jest.spyOn(c.feeder, "ack");
			expect(() => c.runner.parse("ok")).not.toThrow();
			expect(feed).toHaveBeenCalledWith("ok");
			expect(ack).toHaveBeenCalledTimes(1);
		});

		test.each([
			"[G54:1.000,2.000,3.000]",
			"[MSG:Hello]",
			"unrecognized output",
		])("forwards %s to the console", (line) => {
			c.runner.parse(line);
			expect(f.events("serialport:read")).toContainEqual([line]);
		});

		test("parser state marks the query as awaiting its ok and echoes only on request", () => {
			const line = "[GC:G0 G54 G17 G21 G90 G94 M5 M9 T0 F0 S0]";
			c.actionMask.queryParserState.state = true;
			c.runner.parse(line);
			expect(c.actionMask.queryParserState.state).toBe(false);
			expect(c.actionMask.queryParserState.reply).toBe(true);
			expect(f.events("serialport:read")).not.toContainEqual([line]);
			c.actionMask.replyParserState = true;
			c.runner.parse(line);
			expect(f.events("serialport:read")).toContainEqual([line]);
		});

		test.each(["idle", "running", "paused"])(
			"receive-buffer growth while %s",
			(state) => {
				if (state !== "idle") c.workflow.start();
				if (state === "paused") c.workflow.pause();
				c.sender.sp.bufferSize = 100;
				c.actionMask.queryStatusReport = true;
				c.actionMask.replyStatusReport = true;
				const line = "<Run|MPos:0,0,0|Bf:15,512|FS:0,0>";
				c.runner.parse(line);
				expect(c.sender.sp.bufferSize).toBe(state === "idle" ? 504 : 100);
				expect(c.actionMask.queryStatusReport).toBe(false);
				expect(c.actionMask.replyStatusReport).toBe(false);
				expect(f.events("serialport:read")).toContainEqual([line]);
			},
		);

		test("a status report cannot resize the buffer while bytes are outstanding", () => {
			c.sender.sp.bufferSize = 100;
			c.sender.sp.dataLength = 10;
			c.runner.parse("<Run|MPos:0,0,0|Bf:15,512|FS:0,0>");
			expect(c.sender.sp.bufferSize).toBe(100);
		});

		test("a smaller reported buffer does not shrink the configured size", () => {
			c.sender.sp.bufferSize = 256;
			c.runner.parse("<Run|MPos:0,0,0|Bf:15,128|FS:0,0>");
			expect(c.sender.sp.bufferSize).toBe(256);
		});

		test.each(["sender", "feeder"])(
			"%s data preserves trimming and current connection-state checks",
			(queue) => {
				c[queue].emit("data", "  G1 X1  ", {});
				expect(f.writes()).toEqual(["G1 X1\n"]);
				c[queue].emit("data", "  ", {});
				expect(f.writes()).toHaveLength(1);
				f.connection.isOpen = () => false;
				c[queue].emit("data", "G1 X2", {});
				// Grbl reads isOpen as a property; grblHAL calls the method.
				expect(f.writes()).toHaveLength(firmware === "Grbl" ? 2 : 1);
				c.connection = null;
				c[queue].emit("data", "G1 X3", {});
				expect(f.writes()).toHaveLength(firmware === "Grbl" ? 2 : 1);
			},
		);

		test("Sender lifecycle events request estimates and record completion time", () => {
			c.actionTime.senderFinishTime = 300;
			c.sender.emit("start", 100);
			expect(c.actionTime.senderFinishTime).toBe(0);
			c.sender.emit("end", 500);
			expect(c.actionTime.senderFinishTime).toBe(500);
			c.sender.emit("requestData");
			expect(f.events("requestEstimateData")).toEqual([[]]);
		});

		test("streaming pauses after an outstanding acknowledgment and resumes remaining lines", () => {
			c.sender.load("job.nc", "G1 X1 F100\nG1 X2\nG1 X3");
			c.sender.sp.bufferSize = 12;
			c.workflow.start();
			c.sender.next();
			expect(f.writes()).toEqual(["G1 X1 F100\n"]);
			c.workflow.pause();
			c.runner.parse("ok");
			expect(c.sender.state.received).toBe(1);
			expect(f.writes()).toHaveLength(1);
			c.workflow.resume();
			expect(f.writes()).toEqual(["G1 X1 F100\n", "G1 X2\n"]);
			c.runner.parse("ok");
			expect(f.writes()).toEqual(["G1 X1 F100\n", "G1 X2\n", "G1 X3\n"]);
		});

		test.each([false, true])(
			"a running-file error pauses the job, showLineWarnings=%p",
			(showLineWarnings) => {
				f.values.preferences = { showLineWarnings };
				c.settings.errors = [{ code: 2, description: "Bad number format" }];
				c.runner.state.status.activeState = "Run";
				c.sender.load("job.nc", "G1 Xbad\nG1 X2");
				c.workflow.start();
				c.sender.state.sent = 1;
				jest.spyOn(c.sender, "next").mockImplementation(() => {});
				c.runner.parse("error:2");
				expect(c.workflow.state).toBe("paused");
				expect(c.sender.state.hold).toBe(true);
				expect(c.sender.state.received).toBe(1);
				expect(f.events("error")[0][0]).toEqual(
					expect.objectContaining({
						code: "2",
						origin: "job.nc",
						line: "G1 Xbad",
						lineNumber: 0,
						controller: firmware,
					}),
				);
				expect(f.writes()).toEqual(firmware === "Grbl" ? [] : ["!"]);
				expect(f.immediateWrites()).toEqual(firmware === "Grbl" ? [] : ["\n"]);
				if (showLineWarnings) {
					expect(f.events("workflow:state")).toContainEqual([
						"paused",
						{ validLine: false, line: "2 G1 Xbad" },
					]);
				} else expect(f.events("gcode_error")).toHaveLength(1);
			},
		);

		test("console errors retain their origin and clear the pending console input", () => {
			f.values.inAppConsoleInput = "G1 Xbad";
			c.settings.errors = [{ code: 2, description: "Bad number format" }];
			c.runner.state.status.activeState = "Idle";
			c.runner.parse("error:2");
			expect(f.events("error")[0][0]).toEqual(
				expect.objectContaining({ origin: "Console", line: "G1 Xbad" }),
			);
			expect(f.values.inAppConsoleInput).toBeNull();
		});

		test("jog errors abort only the jog and do not acknowledge either queue", () => {
			jest.spyOn(c.jogStreamer, "isActive").mockReturnValue(true);
			jest.spyOn(c.jogStreamer, "onError").mockReturnValue(true);
			const abort = jest
				.spyOn(c.jogStreamer, "abort")
				.mockImplementation(() => {});
			const senderAck = jest.spyOn(c.sender, "ack");
			const feederAck = jest.spyOn(c.feeder, "ack");
			c.runner.parse("error:2");
			expect(abort).toHaveBeenCalledWith("error");
			expect(senderAck).not.toHaveBeenCalled();
			expect(feederAck).not.toHaveBeenCalled();
			expect(c.workflow.state).toBe("idle");
			expect(f.events("error")[0][0]).toEqual(
				expect.objectContaining({ origin: "Jog", line: "jog" }),
			);
		});
	},
);
