import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";

// the SDK ships ESM-only dist output (no CJS build), so plugin unit tests
// mock it rather than depend on a built dist/
// vi.mock factories are hoisted above imports, so the mocks they close over
// must come from vi.hoisted rather than plain top-level consts.
const { addListenerMock, commandMock, loadToVisualizerMock, getSelectorMock } =
	vi.hoisted(() => ({
		addListenerMock: vi.fn(
			(_eventName: string, _callback: (...args: unknown[]) => void) => vi.fn(),
		),
		commandMock: vi.fn(),
		loadToVisualizerMock: vi.fn(),
		getSelectorMock: vi.fn(),
	}));

vi.mock("@sienci/gsender-plugin-sdk", () => ({
	machine: { addListener: addListenerMock, command: commandMock },
	gcode: { loadToVisualizer: loadToVisualizerMock },
	getSelector: getSelectorMock,
}));

// Renders the app and flushes the redux-seeded `getSelector` promise (and
// any state update it triggers) inside `act`, so tests don't hit React's
// "update not wrapped in act" warning for that mount-time microtask.
const renderApp = async () => {
	const result = render(<App />);
	await act(async () => {});
	return result;
};

const callbackFor = (eventName: string) => {
	const call = addListenerMock.mock.calls.find(([name]) => name === eventName);
	if (!call) {
		throw new Error(`machine.addListener was never called for '${eventName}'`);
	}
	return call[1] as (...args: unknown[]) => void;
};

describe("Controller Events Demo", () => {
	beforeEach(() => {
		addListenerMock.mockClear();
		addListenerMock.mockImplementation(() => vi.fn());
		commandMock.mockReset();
		commandMock.mockResolvedValue(undefined);
		loadToVisualizerMock.mockReset();
		loadToVisualizerMock.mockResolvedValue(undefined);
		getSelectorMock.mockReset();
		getSelectorMock.mockResolvedValue(false);
	});

	it("registers a listener for every watched event", async () => {
		await renderApp();

		expect(addListenerMock).toHaveBeenCalledWith(
			"job:start",
			expect.any(Function),
		);
		expect(addListenerMock).toHaveBeenCalledWith(
			"job:stop",
			expect.any(Function),
		);
		expect(addListenerMock).toHaveBeenCalledWith(
			"workflow:state",
			expect.any(Function),
		);
		expect(addListenerMock).toHaveBeenCalledWith(
			"serialport:open",
			expect.any(Function),
		);
		expect(addListenerMock).toHaveBeenCalledWith(
			"serialport:close",
			expect.any(Function),
		);
		expect(addListenerMock).toHaveBeenCalledWith(
			"file:load",
			expect.any(Function),
		);
	});

	it("logs a fired event by name, with no args shown when there are none", async () => {
		await renderApp();

		act(() => {
			callbackFor("job:start")();
		});

		expect(
			screen.getByText("job:start", { selector: ".log-name" }),
		).toBeInTheDocument();
	});

	it("logs the newest event first and renders its args", async () => {
		await renderApp();

		act(() => {
			callbackFor("job:start")();
		});
		act(() => {
			callbackFor("workflow:state")("running");
		});

		const names = screen
			.getAllByText(/^(job:start|workflow:state)$/, { selector: ".log-name" })
			.map((el) => el.textContent);
		expect(names[0]).toBe("workflow:state");
		expect(names[1]).toBe("job:start");
		expect(screen.getByText('["running"]')).toBeInTheDocument();
	});

	it("unsubscribes every listener on unmount", async () => {
		const unsubscribe = vi.fn();
		addListenerMock.mockImplementation(() => unsubscribe);

		const { unmount } = await renderApp();
		unmount();

		expect(unsubscribe).toHaveBeenCalledTimes(6);
	});

	it("disables job controls until connected, and re-disables on disconnect", async () => {
		await renderApp();

		expect(screen.getByText("Load sample")).toBeDisabled();
		expect(screen.getByText("Start")).toBeDisabled();
		expect(screen.getByText("Stop")).toBeDisabled();

		act(() => {
			callbackFor("serialport:open")();
		});
		expect(screen.getByText("Load sample")).toBeEnabled();
		expect(screen.getByText("Start")).toBeEnabled();
		expect(screen.getByText("Stop")).toBeEnabled();

		act(() => {
			callbackFor("serialport:close")();
		});
		expect(screen.getByText("Load sample")).toBeDisabled();
		expect(screen.getByText("Start")).toBeDisabled();
		expect(screen.getByText("Stop")).toBeDisabled();
	});

	it("detects an already-connected machine from redux on mount", async () => {
		getSelectorMock.mockResolvedValueOnce(true);

		await renderApp();

		expect(screen.getByText("Load sample")).toBeEnabled();
		expect(screen.getByText("Start")).toBeEnabled();
	});

	it("loads the sample gcode without starting the job", async () => {
		await renderApp();

		act(() => {
			callbackFor("serialport:open")();
		});

		await act(async () => {
			fireEvent.click(screen.getByText("Load sample"));
		});

		expect(loadToVisualizerMock).toHaveBeenCalledWith(
			expect.any(String),
			"controller-events-demo.gcode",
		);
		expect(commandMock).not.toHaveBeenCalled();
	});

	it("starts the job independently of loading the sample", async () => {
		await renderApp();

		act(() => {
			callbackFor("serialport:open")();
		});

		await act(async () => {
			fireEvent.click(screen.getByText("Start"));
		});

		expect(commandMock).toHaveBeenCalledWith("gcode:start");
		expect(loadToVisualizerMock).not.toHaveBeenCalled();
	});

	it("stops the job with a forced stop command", async () => {
		await renderApp();

		act(() => {
			callbackFor("serialport:open")();
		});

		await act(async () => {
			fireEvent.click(screen.getByText("Stop"));
		});

		expect(commandMock).toHaveBeenCalledWith("gcode:stop", { force: true });
	});

	it("logs an error entry instead of throwing when the command rejects", async () => {
		commandMock.mockRejectedValueOnce(new Error("not connected"));
		await renderApp();

		act(() => {
			callbackFor("serialport:open")();
		});

		await act(async () => {
			fireEvent.click(screen.getByText("Start"));
		});

		expect(
			screen.getByText("error", { selector: ".log-name" }),
		).toBeInTheDocument();
		expect(screen.getByText('["not connected"]')).toBeInTheDocument();
	});
});
