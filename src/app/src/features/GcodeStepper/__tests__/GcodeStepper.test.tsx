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
// doesn't implement — a no-op stub is enough since the readout under test
// doesn't depend on the source panel's windowing.
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

jest.mock("app/hooks/useTypedSelector", () => {
	const longLine = `G1 ${Array.from({ length: 30 }, (_, i) => `X${i}.000 Y${i}.000`).join(" ")}`;
	const fileLines = [longLine, "G1 X1 Y1", "G1 X2 Y2", "G1 X3 Y3", "M5", "M2"];
	return {
		useTypedSelector: jest.fn(() => ({
			content: fileLines.join("\n"),
			total: fileLines.length,
			usedAxes: [],
			fileType: "DEFAULT",
			toolSet: [],
			spindleToolEvents: {},
			estimatedTime: 0,
		})),
	};
});

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

// The real visualizer wraps @sienci/gviewer's 3D canvas — irrelevant to the
// readout under test, and heavy to construct in jsdom. Kept minimal: it just
// has to satisfy the imperative `seekTo` handle the parent calls on every
// navigation.
jest.mock("../components/StepThroughVisualizer", () => {
	const ReactActual = jest.requireActual("react");
	return {
		__esModule: true,
		default: ReactActual.forwardRef(
			(_props: unknown, ref: React.Ref<{ seekTo: () => void }>) => {
				ReactActual.useImperativeHandle(ref, () => ({ seekTo: jest.fn() }));
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

describe("GcodeStepper current line readout", () => {
	// Also waits out the async line-position index build the component kicks
	// off on open, so it doesn't resolve mid-test and trip an act() warning.
	const renderStepper = async () => {
		render(<GcodeStepper open onOpenChange={jest.fn()} />);
		await screen.findByTestId("current-line-readout");
	};

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
		renderStepper();

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
		renderStepper();

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
		renderStepper();

		expect(screen.queryByTestId("current-line-readout")).not.toBeNull();

		await user.click(screen.getByText("mock-scrub-to-3"));
		expect(screen.queryByTestId("current-line-readout")).not.toBeNull();

		await user.click(screen.getByText("mock-scrub-end-at-3"));
		expect(screen.queryByTestId("current-line-readout")).not.toBeNull();
	});
});
