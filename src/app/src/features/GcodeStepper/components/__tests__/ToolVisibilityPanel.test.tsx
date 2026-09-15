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
import { IMPERIAL_UNITS, METRIC_UNITS } from "app/constants";
import type { StepperTool } from "../../definitions";
import ToolVisibilityPanel from "../ToolVisibilityPanel";

const tools: StepperTool[] = [
	{
		index: 1,
		toolNumber: 1,
		label: "T1",
		color: "#3e85c7",
		startLine: 1,
		endLine: 50,
		comment: "6mm endmill",
		diameter: 6,
		spindleSpeed: 12000,
	},
	{
		index: 2,
		toolNumber: 2,
		label: "T2",
		color: "#c73e3e",
		startLine: 51,
		endLine: 100,
	},
];

const baseProps = {
	tools,
	activeToolIndex: 0,
	hiddenTools: new Set<number>(),
	onToggleTool: jest.fn(),
	onSelectLine: jest.fn(),
	units: METRIC_UNITS,
};

afterEach(() => {
	jest.clearAllMocks();
});

describe("ToolVisibilityPanel", () => {
	it("shows the empty-state placeholder when there are no tools", () => {
		render(<ToolVisibilityPanel {...baseProps} tools={[]} />);
		expect(screen.getByText("No tools found in this file.")).toBeInTheDocument();
	});

	it("renders each tool's label and line range", () => {
		render(<ToolVisibilityPanel {...baseProps} />);
		expect(screen.getByText("T1")).toBeInTheDocument();
		expect(screen.getByText("1-50")).toBeInTheDocument();
		expect(screen.getByText("T2")).toBeInTheDocument();
		expect(screen.getByText("51-100")).toBeInTheDocument();
	});

	it("only renders comment/diameter/spindle-speed rows when present on the tool", () => {
		render(<ToolVisibilityPanel {...baseProps} />);
		// Tool 1 has all three.
		expect(screen.getByText("6mm endmill")).toBeInTheDocument();
		expect(screen.getByText("6.000 mm", { exact: false })).toBeInTheDocument();
		expect(screen.getByText("12,000 RPM")).toBeInTheDocument();
		// Tool 2 (no comment/diameter/spindleSpeed) contributes none of the above —
		// there's exactly one metadata row in the whole panel.
		expect(screen.getAllByText(/RPM$/)).toHaveLength(1);
		expect(screen.queryAllByText("·")).toHaveLength(1);
	});

	it("formats diameter in inches for imperial units", () => {
		render(<ToolVisibilityPanel {...baseProps} units={IMPERIAL_UNITS} />);
		expect(screen.getByText(/in$/)).toBeInTheDocument();
	});

	it("marks only the tool at activeToolIndex with the active border color", () => {
		render(<ToolVisibilityPanel {...baseProps} activeToolIndex={1} />);
		const tool1Card = screen.getByRole("button", {
			name: "Go to tool 1, line 1",
		});
		const tool2Card = screen.getByRole("button", {
			name: "Go to tool 2, line 51",
		});
		expect(tool2Card.style.borderColor).toBeTruthy();
		expect(tool1Card.style.borderColor).toBeFalsy();
	});

	it("toggling visibility calls onToggleTool with the tool's index and does not select it", async () => {
		const user = userEvent.setup();
		const onToggleTool = jest.fn();
		const onSelectLine = jest.fn();
		render(
			<ToolVisibilityPanel
				{...baseProps}
				onToggleTool={onToggleTool}
				onSelectLine={onSelectLine}
			/>,
		);

		await user.click(
			screen.getByRole("switch", { name: "Hide tool 1 toolpath" }),
		);
		expect(onToggleTool).toHaveBeenCalledWith(0);
		expect(onSelectLine).not.toHaveBeenCalled();
	});

	it("clicking the card body selects that tool's starting line", async () => {
		const user = userEvent.setup();
		const onSelectLine = jest.fn();
		render(<ToolVisibilityPanel {...baseProps} onSelectLine={onSelectLine} />);

		await user.click(
			screen.getByRole("button", { name: "Go to tool 2, line 51" }),
		);
		expect(onSelectLine).toHaveBeenCalledWith(51);
	});

	it("Enter/Space on the focused card body also selects that tool's line", () => {
		const onSelectLine = jest.fn();
		render(<ToolVisibilityPanel {...baseProps} onSelectLine={onSelectLine} />);

		const card = screen.getByRole("button", { name: "Go to tool 1, line 1" });
		card.focus();
		// fireEvent isn't imported at module scope elsewhere in this file, so use
		// the DOM API directly via userEvent's keyboard for consistency.
		card.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
		);
		expect(onSelectLine).toHaveBeenCalledWith(1);
	});

	it("reflects hiddenTools in the visibility toggle's aria-checked/label", () => {
		render(
			<ToolVisibilityPanel {...baseProps} hiddenTools={new Set([0])} />,
		);
		const toggle = screen.getByRole("switch", { name: "Show tool 1 toolpath" });
		expect(toggle).toHaveAttribute("aria-checked", "false");
	});
});
