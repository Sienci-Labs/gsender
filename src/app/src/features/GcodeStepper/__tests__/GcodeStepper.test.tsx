/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import GcodeStepper from "../index";

// GCodeSourcePanel measures its viewport via ResizeObserver, which jsdom
// doesn't implement — a no-op stub is enough since none of these tests
// depend on the source panel's windowing.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
// biome-ignore lint/suspicious/noExplicitAny: test-only global polyfill
(global as any).ResizeObserver = ResizeObserverStub;

// A line deliberately longer than the source panel's row would render
// without wrapping, so its presence (or absence, if truncated) is provable.
// Duplicated into the jest.mock factory below (which Jest hoists above these
// module-scope consts, so it can't close over them) — keep the two in sync.
const LONG_LINE = `G1 ${Array.from({ length: 30 }, (_, i) => `X${i}.000 Y${i}.000`).join(" ")}`;
const FILE_LINES = [LONG_LINE, "G1 X1 Y1", "G1 X2 Y2", "G1 X3 Y3", "M5", "M2"];
const CONTENT = FILE_LINES.join("\n");

const DEFAULT_FILE_STATE = {
	content: CONTENT,
	total: FILE_LINES.length,
	usedAxes: [] as string[],
	fileType: "DEFAULT",
	toolSet: [] as string[],
	spindleToolEvents: {} as Record<string, unknown>,
	estimatedTime: 0,
};

const EMPTY_FILE_STATE = {
	content: "",
	total: 0,
	usedAxes: [] as string[],
	fileType: "DEFAULT",
	toolSet: [] as string[],
	spindleToolEvents: {} as Record<string, unknown>,
	estimatedTime: 0,
};

// Mock-prefixed so babel-plugin-jest-hoist allows the jest.mock() factories
// below (which Jest hoists above these declarations) to close over them —
// safe because the factories only *read* them from inside a nested render
// function, which doesn't run until a test actually calls render(), by which
// point this whole module has finished loading.
const mockUseTypedSelector = jest.fn(() => DEFAULT_FILE_STATE);
const mockSeekTo = jest.fn();
let mockLastVisualizerProps: Record<string, unknown> | null = null;

jest.mock("app/hooks/useTypedSelector", () => ({
	// Wrapped rather than assigned directly: this object literal is evaluated
	// eagerly when `../index` is first required (at the `import` above), which
	// happens before `mockUseTypedSelector` further down this file is
	// initialized. The wrapper defers the reference to call time, by which
	// point the whole module has loaded.
	useTypedSelector: (...args: unknown[]) => mockUseTypedSelector(...args),
}));

jest.mock("app/hooks/useWorkspaceState", () => ({
	useWorkspaceState: jest.fn(() => ({
		units: "mm",
		enableDarkMode: false,
	})),
}));

jest.mock("app/features/Visualizer/lastWorkerGeometry", () => ({
	getLastWorkerGeometry: jest.fn(() => null),
}));

jest.mock("app/store", () => ({
	__esModule: true,
	default: { get: jest.fn(() => false) },
}));

// The repo-wide mock at src/app/src/__mocks__/reactSyntaxHighlighterMock.js
// omits `__esModule`, so a default import resolves to the whole `{ Prism,
// default }` object rather than a component — fine for code that only touches
// `.Prism`, but GCodeSourcePanel default-imports the library directly, which
// this feature renders un-mocked. Overridden locally with a real functional
// stub so the source panel (and therefore the readout under test, which sits
// alongside it) can render.
jest.mock("react-syntax-highlighter", () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => children,
}));

// The real visualizer wraps @sienci/gviewer's 3D canvas — irrelevant to these
// tests, and heavy to construct in jsdom. Kept minimal: it records the last
// props it was rendered with (so hiddenGroups/lineGroups wiring can be
// asserted on) and satisfies the imperative `seekTo` handle the parent calls
// on every navigation.
jest.mock("../components/StepThroughVisualizer", () => {
	const ReactActual = jest.requireActual("react");
	return {
		__esModule: true,
		default: ReactActual.forwardRef(
			(
				props: Record<string, unknown>,
				ref: React.Ref<{ seekTo: (...args: unknown[]) => void }>,
			) => {
				mockLastVisualizerProps = props;
				ReactActual.useImperativeHandle(ref, () => ({ seekTo: mockSeekTo }));
				return null;
			},
		),
	};
});

// The real scrubber derives the target line from pointer position against a
// DOM rect, which jsdom always reports as zero-sized — real pointer-drag
// simulation can't reach a specific line. Stubbed with buttons that call the
// same onScrub/onScrubEnd contract directly, so the readout's freeze/resume
// behavior can be driven deterministically.
jest.mock("../components/StepThroughScrubber", () => ({
	__esModule: true,
	default: ({
		onScrub,
		onScrubEnd,
	}: {
		onScrub: (line: number) => void;
		onScrubEnd?: (line: number) => void;
	}) => (
		<div>
			<button type="button" onClick={() => onScrub(3)}>
				mock-scrub-to-3
			</button>
			<button type="button" onClick={() => onScrubEnd?.(3)}>
				mock-scrub-end-at-3
			</button>
		</div>
	),
}));

// Also waits out the async line-position index build the component kicks off
// on open, so it doesn't resolve mid-test and trip an act() warning.
const renderStepper = async (onOpenChange = jest.fn()) => {
	render(<GcodeStepper open onOpenChange={onOpenChange} />);
	await screen.findByTestId("current-line-readout");
};

beforeEach(() => {
	mockUseTypedSelector.mockReturnValue(DEFAULT_FILE_STATE);
});

afterEach(() => {
	jest.clearAllMocks();
	mockLastVisualizerProps = null;
});

describe("GcodeStepper current line readout", () => {
	it("shows the full current line, un-dimmed, at rest", async () => {
		await renderStepper();

		const readout = screen.getByTestId("current-line-readout");
		expect(readout).toHaveTextContent("1");
		expect(readout).toHaveTextContent(LONG_LINE);
		expect(readout.className).not.toContain("opacity-50");
		// Regression guard: this readout must not clip like the source panel's
		// rows do.
		expect(readout.className).not.toContain("truncate");
	});

	it("updates to the new line after a manual step", async () => {
		const user = userEvent.setup();
		await renderStepper();

		// Jumps by +100, clamped to the last line (6, "M2") for this fixture.
		await user.click(
			screen.getByRole("button", { name: /forward 100 lines/i }),
		);

		const readout = screen.getByTestId("current-line-readout");
		expect(readout).toHaveTextContent("6");
		expect(readout).toHaveTextContent("M2");
		expect(readout.className).not.toContain("opacity-50");
	});

	it("freezes and dims while scrubbing, then resumes once the scrub ends", async () => {
		const user = userEvent.setup();
		await renderStepper();

		await user.click(screen.getByText("mock-scrub-to-3"));

		// Still line 1's text — the scrub moved currentLine to 3, but the
		// readout must not have refreshed off it.
		let readout = screen.getByTestId("current-line-readout");
		expect(readout).toHaveTextContent("1");
		expect(readout).toHaveTextContent(LONG_LINE);
		expect(readout.className).toContain("opacity-50");

		await user.click(screen.getByText("mock-scrub-end-at-3"));

		readout = screen.getByTestId("current-line-readout");
		expect(readout).toHaveTextContent("3");
		expect(readout).toHaveTextContent("G1 X2 Y2");
		expect(readout.className).not.toContain("opacity-50");
	});

	it("never unmounts the readout across idle/scrubbing transitions", async () => {
		const user = userEvent.setup();
		await renderStepper();

		expect(screen.queryByTestId("current-line-readout")).not.toBeNull();

		await user.click(screen.getByText("mock-scrub-to-3"));
		expect(screen.queryByTestId("current-line-readout")).not.toBeNull();

		await user.click(screen.getByText("mock-scrub-end-at-3"));
		expect(screen.queryByTestId("current-line-readout")).not.toBeNull();
	});
});

describe("GcodeStepper controls", () => {
	it("steps forward and backward, clamped to the file's bounds", async () => {
		const user = userEvent.setup();
		await renderStepper();

		await user.click(
			screen.getByRole("button", { name: /forward 1000 lines/i }),
		);
		expect(screen.getByTestId("current-line-readout")).toHaveTextContent("6");

		await user.click(screen.getByRole("button", { name: /back 100 lines/i }));
		expect(screen.getByTestId("current-line-readout")).toHaveTextContent("1");
	});

	it("resets to line 1", async () => {
		const user = userEvent.setup();
		await renderStepper();

		await user.click(
			screen.getByRole("button", { name: /forward 100 lines/i }),
		);
		expect(screen.getByTestId("current-line-readout")).toHaveTextContent("6");

		await user.click(screen.getByRole("button", { name: "Reset to start" }));
		expect(screen.getByTestId("current-line-readout")).toHaveTextContent("1");
	});

	it("passes the current line's position to the mocked visualizer's seekTo on every step", async () => {
		const user = userEvent.setup();
		await renderStepper();
		mockSeekTo.mockClear();

		await user.click(
			screen.getByRole("button", { name: /forward 100 lines/i }),
		);
		expect(mockSeekTo).toHaveBeenCalled();
	});

	it("flips the hide-processed toggle's label and the third seekTo argument", async () => {
		const user = userEvent.setup();
		await renderStepper();

		expect(
			screen.getByRole("switch", { name: "Hide prior lines" }),
		).toBeInTheDocument();
		expect(mockSeekTo).toHaveBeenLastCalledWith(
			expect.anything(),
			expect.anything(),
			"grey",
		);

		await user.click(screen.getByRole("switch"));

		expect(
			screen.getByRole("switch", { name: "Show prior lines" }),
		).toBeInTheDocument();
		expect(mockSeekTo).toHaveBeenLastCalledWith(
			expect.anything(),
			expect.anything(),
			"hide",
		);
	});

	it("toggling a tool's visibility updates the hiddenGroups set passed to the visualizer", async () => {
		const user = userEvent.setup();
		// No M6 toolchange in spindleToolEvents, but a toolSet entry — takes the
		// single-synthetic-tool fallback path in buildStepperTools, spanning the
		// whole file as "T1".
		mockUseTypedSelector.mockReturnValue({
			...DEFAULT_FILE_STATE,
			toolSet: ["T1"],
		});
		await renderStepper();

		expect(mockLastVisualizerProps?.hiddenGroups).toEqual(new Set());

		await user.click(
			screen.getByRole("switch", { name: "Hide tool 1 toolpath" }),
		);

		expect(mockLastVisualizerProps?.hiddenGroups).toEqual(new Set([0]));
	});

	it("calls onOpenChange(false) when the close button is clicked", async () => {
		const user = userEvent.setup();
		const onOpenChange = jest.fn();
		await renderStepper(onOpenChange);

		await user.click(
			screen.getByRole("button", { name: "Close step through" }),
		);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("renders disabled controls when no file is loaded", async () => {
		mockUseTypedSelector.mockReturnValue(EMPTY_FILE_STATE);
		await renderStepper();

		expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
		expect(
			screen.getByRole("button", { name: /forward 100 lines/i }),
		).toBeDisabled();
		expect(
			screen.getByText("No tools found in this file."),
		).toBeInTheDocument();
	});
});
