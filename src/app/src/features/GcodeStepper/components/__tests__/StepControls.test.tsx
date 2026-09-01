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
import StepControls from "../StepControls";

const baseProps = {
	currentLine: 50,
	totalLines: 100,
	onStep: jest.fn(),
	isPlaying: false,
	speed: 10,
	onSpeedChange: jest.fn(),
	onTogglePlay: jest.fn(),
	onReset: jest.fn(),
};

afterEach(() => {
	jest.clearAllMocks();
});

describe("StepControls", () => {
	it("shows Play and swaps to Pause when isPlaying", () => {
		const { rerender } = render(<StepControls {...baseProps} />);
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();

		rerender(<StepControls {...baseProps} isPlaying />);
		expect(
			screen.getByRole("button", { name: "Pause playback" }),
		).toBeInTheDocument();
	});

	it("disables the play button when the file is empty", () => {
		render(<StepControls {...baseProps} totalLines={0} />);
		expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
	});

	it("disables back-step buttons at line 1", () => {
		render(<StepControls {...baseProps} currentLine={1} />);
		expect(
			screen.getByRole("button", { name: "Back 100 lines" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Back 1000 lines" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Forward 100 lines" }),
		).toBeEnabled();
	});

	it("disables forward-step buttons at the last line", () => {
		render(
			<StepControls {...baseProps} currentLine={100} totalLines={100} />,
		);
		expect(
			screen.getByRole("button", { name: "Forward 100 lines" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Forward 1000 lines" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Back 100 lines" }),
		).toBeEnabled();
	});

	it("calls onStep with the exact delta for each step button", async () => {
		const user = userEvent.setup();
		const onStep = jest.fn();
		render(<StepControls {...baseProps} onStep={onStep} />);

		await user.click(screen.getByRole("button", { name: "Back 1000 lines" }));
		await user.click(screen.getByRole("button", { name: "Back 100 lines" }));
		await user.click(
			screen.getByRole("button", { name: "Forward 100 lines" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Forward 1000 lines" }),
		);

		expect(onStep).toHaveBeenNthCalledWith(1, -1000);
		expect(onStep).toHaveBeenNthCalledWith(2, -100);
		expect(onStep).toHaveBeenNthCalledWith(3, 100);
		expect(onStep).toHaveBeenNthCalledWith(4, 1000);
	});

	it("marks only the active speed preset and calls onSpeedChange on click", async () => {
		const user = userEvent.setup();
		const onSpeedChange = jest.fn();
		render(
			<StepControls {...baseProps} speed={10} onSpeedChange={onSpeedChange} />,
		);

		expect(screen.getByRole("button", { name: "10x" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "1x" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);

		await user.click(screen.getByRole("button", { name: "100x" }));
		expect(onSpeedChange).toHaveBeenCalledWith(100);
	});

	it("calls onReset when the reset button is clicked", async () => {
		const user = userEvent.setup();
		const onReset = jest.fn();
		render(<StepControls {...baseProps} onReset={onReset} />);

		await user.click(screen.getByRole("button", { name: "Reset to start" }));
		expect(onReset).toHaveBeenCalledTimes(1);
	});
});
