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
import type { ModalState } from "@sienci/gviewer";
import type { LineModalState } from "../../definitions";
import StepThroughStatus from "../StepThroughStatus";

const makeModalState = (
	overrides: Partial<ModalState> = {},
	feedRate = Number.NaN,
	spindleSpeed = Number.NaN,
): LineModalState => ({
	modals: {
		motion: "G1",
		coordinateSystem: "G54",
		plane: "G17",
		units: "G21",
		distance: "G90",
		feedMode: "G94",
		spindle: null,
		coolant: null,
		tool: null,
		...overrides,
	} as ModalState,
	feedRate,
	spindleSpeed,
});

const baseProps = {
	position: { x: 12.3456, y: -1, z: 0, a: 0 },
	showAAxis: false,
	units: METRIC_UNITS,
	modalState: makeModalState(),
	previousModalState: null,
	hideProcessed: false,
	onToggleHideProcessed: jest.fn(),
};

afterEach(() => {
	jest.clearAllMocks();
});

describe("StepThroughStatus", () => {
	it("formats position in mm for metric units", () => {
		render(<StepThroughStatus {...baseProps} />);
		expect(screen.getByText("12.346")).toBeInTheDocument();
		expect(screen.getByText("-1.000")).toBeInTheDocument();
	});

	it("converts position to inches for imperial units", () => {
		render(
			<StepThroughStatus
				{...baseProps}
				units={IMPERIAL_UNITS}
				position={{ x: 25.4, y: 0, z: 0, a: 0 }}
			/>,
		);
		expect(screen.getByText("1.000")).toBeInTheDocument();
	});

	it("only renders the A axis readout when showAAxis is true", () => {
		const { rerender } = render(<StepThroughStatus {...baseProps} />);
		expect(screen.queryByText("A")).not.toBeInTheDocument();

		rerender(
			<StepThroughStatus
				{...baseProps}
				showAAxis
				position={{ x: 0, y: 0, z: 0, a: 45 }}
			/>,
		);
		expect(screen.getByText("A")).toBeInTheDocument();
		expect(screen.getByText("45.000°")).toBeInTheDocument();
	});

	it("shows a placeholder when modalState hasn't been computed yet", () => {
		render(<StepThroughStatus {...baseProps} modalState={null} />);
		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("substitutes GRBL power-on defaults for unset spindle/coolant/tool/feed/speed", () => {
		render(<StepThroughStatus {...baseProps} />);
		expect(screen.getByText("M5")).toBeInTheDocument();
		expect(screen.getByText("M9")).toBeInTheDocument();
		expect(screen.getByText("T0")).toBeInTheDocument();
		expect(screen.getByText("F0")).toBeInTheDocument();
		expect(screen.getByText("S0")).toBeInTheDocument();
	});

	it("highlights a modal group that changed since the previous line", () => {
		const previous = makeModalState({ spindle: "M5" });
		const current = makeModalState({ spindle: "M3" });
		render(
			<StepThroughStatus
				{...baseProps}
				modalState={current}
				previousModalState={previous}
			/>,
		);
		// The changed cell bolds its value — assert via font-bold rather than a
		// full class-string match.
		expect(screen.getByText("M3").className).toContain("font-bold");
		// Motion (G1 both times) didn't change.
		expect(screen.getByText("G1").className).not.toContain("font-bold");
	});

	it("flips the hide/show-processed button label and aria-checked with the prop, and fires its callback", async () => {
		const user = userEvent.setup();
		const onToggleHideProcessed = jest.fn();
		const { rerender } = render(
			<StepThroughStatus
				{...baseProps}
				hideProcessed={false}
				onToggleHideProcessed={onToggleHideProcessed}
			/>,
		);
		const button = screen.getByRole("switch");
		expect(button).toHaveAttribute("aria-checked", "false");
		expect(button).toHaveTextContent("Hide prior lines");

		await user.click(button);
		expect(onToggleHideProcessed).toHaveBeenCalledTimes(1);

		rerender(
			<StepThroughStatus
				{...baseProps}
				hideProcessed
				onToggleHideProcessed={onToggleHideProcessed}
			/>,
		);
		expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
		expect(screen.getByRole("switch")).toHaveTextContent("Show prior lines");
	});
});
