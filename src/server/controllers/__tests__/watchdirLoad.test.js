jest.mock("../../lib/logger", () => () => ({
	silly: jest.fn(),
	debug: jest.fn(),
	verbose: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));
jest.mock("../../services/monitor", () => ({ readFile: jest.fn() }));

import { EventEmitter } from "events";
import monitor from "../../services/monitor";
import store from "../../store";
import GrblController from "../Grbl/GrblController";
import GrblHalController from "../Grblhal/GrblHalController";

const GCODE = "G21\nG90\nG1 X1 F100";

// Exercise the real command dispatch, Sender, and Workflow with no serial device.
describe.each([
	["Grbl", GrblController, "\n%wait ; Wait for the planner to empty"],
	["grblHAL", GrblHalController, "\n"],
])("%s watchdir:load", (_firmware, Controller, suffix) => {
	let controller;
	let connection;

	beforeEach(() => {
		monitor.readFile.mockReset();
		jest.spyOn(store, "get").mockImplementation((_key, fallback) => fallback);
		connection = Object.assign(new EventEmitter(), {
			emitToSockets: jest.fn(),
			setWriteFilter: jest.fn(),
			write: jest.fn(),
			writeImmediate: jest.fn(),
			isOpen: () => true,
			isClose: () => false,
		});
		controller = new Controller(
			{ event: { on() {}, trigger() {} } },
			connection,
			{ port: "/dev/fake", baudrate: 115200 },
		);
		jest.spyOn(controller.workflow, "stop");
	});

	afterEach(() => {
		controller.destroy();
		jest.restoreAllMocks();
	});

	test.each(["part.nc", "jobs/test part é.nc", "jobs\\test part.nc"])(
		"preserves the selected path %s in Sender and the callback",
		(file) => {
			const callback = jest.fn();
			controller.command("watchdir:load", file, callback);

			expect(monitor.readFile).toHaveBeenCalledTimes(1);
			expect(monitor.readFile).toHaveBeenCalledWith(file, expect.any(Function));
			expect(callback).not.toHaveBeenCalled();
			expect(controller.sender.state.name).toBe("");

			// Complete the read after dispatch, as the filesystem monitor does.
			monitor.readFile.mock.calls[0][1](null, GCODE);

			expect(controller.sender.state.name).toBe(file);
			expect(controller.sender.state.gcode).toBe(GCODE + suffix);
			expect(controller.sender.getContext()).toEqual({});
			expect(callback).toHaveBeenCalledTimes(1);
			expect(callback).toHaveBeenCalledWith(
				null,
				expect.objectContaining({ name: file, context: {}, sent: 0 }),
			);
			expect(controller.workflow.stop).toHaveBeenCalledTimes(1);
			expect(connection.write).not.toHaveBeenCalled();
			expect(connection.writeImmediate).not.toHaveBeenCalled();
		},
	);

	test("returns read errors without replacing the loaded job", () => {
		controller.sender.load("existing.nc", GCODE);
		const previous = controller.sender.toJSON();
		const callback = jest.fn();
		const error = new Error("File not found");
		controller.command("watchdir:load", "missing.nc", callback);
		monitor.readFile.mock.calls[0][1](error);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(error);
		expect(controller.sender.toJSON()).toEqual(previous);
		expect(controller.workflow.stop).not.toHaveBeenCalled();
	});

	test("loads a named job when no callback is supplied", () => {
		controller.command("watchdir:load", "part.nc");
		expect(() => monitor.readFile.mock.calls[0][1](null, GCODE)).not.toThrow();
		expect(controller.sender.state.name).toBe("part.nc");
	});
});
