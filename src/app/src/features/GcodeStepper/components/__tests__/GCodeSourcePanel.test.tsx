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
import GCodeSourcePanel from "../GCodeSourcePanel";

// GCodeSourcePanel measures its viewport via ResizeObserver, which jsdom
// doesn't implement.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
// biome-ignore lint/suspicious/noExplicitAny: test-only global polyfill
(global as any).ResizeObserver = ResizeObserverStub;

jest.mock("app/hooks/useWorkspaceState", () => ({
	useWorkspaceState: jest.fn(() => ({ enableDarkMode: false })),
}));

// The repo-wide react-syntax-highlighter mock (moduleNameMapper in
// jest.config.js) omits `__esModule`, so a default import resolves to the
// whole `{ Prism, default }` object rather than a component. Overridden
// locally with a real functional stub.
jest.mock("react-syntax-highlighter", () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => children,
}));

const LINES = ["G0 X0 Y0", "G1 X10 Y10 F1000", "G1 X20 Y20", "M5", "M2"];

afterEach(() => {
	jest.clearAllMocks();
});

describe("GCodeSourcePanel", () => {
	it("calls onSelectLine with the clicked row's line number", async () => {
		const user = userEvent.setup();
		const onSelectLine = jest.fn();
		render(
			<GCodeSourcePanel
				lines={LINES}
				currentLine={2}
				onSelectLine={onSelectLine}
			/>,
		);

		await user.click(screen.getByText("G1 X20 Y20"));
		expect(onSelectLine).toHaveBeenCalledWith(3);
	});

	it("'Go to start' jumps to line 1", async () => {
		const user = userEvent.setup();
		const onSelectLine = jest.fn();
		render(
			<GCodeSourcePanel
				lines={LINES}
				currentLine={4}
				onSelectLine={onSelectLine}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Go to start" }));
		expect(onSelectLine).toHaveBeenCalledWith(1);
	});

	it("filters to matching lines (case-insensitive) and shows the match count", async () => {
		const user = userEvent.setup();
		render(
			<GCodeSourcePanel lines={LINES} currentLine={1} onSelectLine={jest.fn()} />,
		);

		await user.click(screen.getByRole("button", { name: "Search G-code" }));
		await user.type(screen.getByPlaceholderText("Search..."), "g1");

		// The match count sits right next to the search input, distinct from the
		// (also-"2") line-2 gutter — matched by that adjacency, not text alone.
		const matchCount = screen
			.getByPlaceholderText("Search...")
			.parentElement?.querySelector("span");
		expect(matchCount).toHaveTextContent("2");
	});

	it("shows an em-dash for the match count when the search field is empty", async () => {
		const user = userEvent.setup();
		render(
			<GCodeSourcePanel lines={LINES} currentLine={1} onSelectLine={jest.fn()} />,
		);
		await user.click(screen.getByRole("button", { name: "Search G-code" }));
		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("Enter in the search field jumps to the next match after currentLine, wrapping at the end", async () => {
		const user = userEvent.setup();
		const onSelectLine = jest.fn();
		const lines = ["G1 X1", "G0 X2", "G1 X3", "G0 X4", "G1 X5"];
		render(
			<GCodeSourcePanel
				lines={lines}
				currentLine={3}
				onSelectLine={onSelectLine}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Search G-code" }));
		const input = screen.getByPlaceholderText("Search...");
		await user.type(input, "G1");
		await user.keyboard("{Enter}");

		// Matches are lines 1, 3, 5. Past currentLine (3), the next is 5.
		expect(onSelectLine).toHaveBeenCalledWith(5);
	});

	it("wraps search navigation back to the first match past the last line", async () => {
		const user = userEvent.setup();
		const onSelectLine = jest.fn();
		const lines = ["G1 X1", "G0 X2", "G1 X3"];
		render(
			<GCodeSourcePanel
				lines={lines}
				currentLine={3}
				onSelectLine={onSelectLine}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Search G-code" }));
		await user.type(screen.getByPlaceholderText("Search..."), "G1");
		await user.keyboard("{Enter}");

		// Matches are lines 1 and 3; from currentLine 3 there's nothing further on,
		// so it wraps to the first match.
		expect(onSelectLine).toHaveBeenCalledWith(1);
	});
});
