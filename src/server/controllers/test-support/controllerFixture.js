jest.mock("../../lib/logger", () => () => ({
	silly: jest.fn(),
	debug: jest.fn(),
	verbose: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

import { EventEmitter } from "events";
import { get, set } from "lodash";
import config from "../../services/configstore";
import store from "../../store";
import GrblController from "../Grbl/GrblController";
import GrblHalController from "../Grblhal/GrblHalController";

export const FIRMWARES = [
	["Grbl", GrblController],
	["grblHAL", GrblHalController],
];

// Keep real controllers, parsers, Sender, Feeder, Workflow, and event wiring.
// Substitute only serial transport, persistent configuration, and the clock.
export function useControllerFixture(Controller) {
	const fixture = {};
	beforeEach(() => {
		jest.useFakeTimers({ now: 1000000 });
		jest.spyOn(console, "log").mockImplementation(() => {});
		fixture.values = {};
		fixture.config = {};
		jest
			.spyOn(store, "get")
			.mockImplementation((key, fallback) =>
				get(fixture.values, key, fallback),
			);
		jest
			.spyOn(store, "set")
			.mockImplementation((key, value) => set(fixture.values, key, value));
		jest
			.spyOn(config, "get")
			.mockImplementation((key, fallback) =>
				get(fixture.config, key, fallback),
			);
		fixture.connection = Object.assign(new EventEmitter(), {
			emitToSockets: jest.fn(),
			setWriteFilter: jest.fn(),
			write: jest.fn(),
			writeImmediate: jest.fn(),
			isOpen: () => true,
			isClose: () => false,
		});
		fixture.engine = {
			event: Object.assign(new EventEmitter(), { trigger: jest.fn() }),
			unload: jest.fn(),
		};
		fixture.controller = new Controller(fixture.engine, fixture.connection, {
			port: "/dev/fake",
			baudrate: 115200,
		});
		// Background device polling is outside these command/lifecycle tests.
		clearInterval(fixture.controller.queryTimer);
		fixture.controller.queryTimer = null;
		fixture.controller.state = fixture.controller.runner.state;
		fixture.controller.settings = fixture.controller.runner.settings;
		fixture.writes = () =>
			fixture.connection.write.mock.calls.map(([data]) => data);
		fixture.immediateWrites = () =>
			fixture.connection.writeImmediate.mock.calls.map(([data]) => data);
		fixture.events = (name) =>
			fixture.connection.emitToSockets.mock.calls
				.filter(([event]) => event === name)
				.map(([, ...args]) => args);
	});
	afterEach(() => {
		fixture.controller?.feeder?.clear();
		fixture.controller?.destroy();
		jest.clearAllTimers();
		jest.restoreAllMocks();
		jest.useRealTimers();
	});
	return fixture;
}
