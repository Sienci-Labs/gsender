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

import { fireEvent, render, screen } from "@testing-library/react";
import StepThroughScrubber from "../StepThroughScrubber";

// jsdom doesn't implement the Pointer Events capture API the scrubber uses
// on pointerdown/up.
// biome-ignore lint/suspicious/noExplicitAny: test-only DOM polyfill
Element.prototype.setPointerCapture ??= function () {} as any;
// biome-ignore lint/suspicious/noExplicitAny: test-only DOM polyfill
Element.prototype.releasePointerCapture ??= function () {} as any;
Element.prototype.hasPointerCapture ??= () => false;

afterEach(() => {
	jest.clearAllMocks();
});

describe("StepThroughScrubber", () => {
	it("reflects currentLine/totalLines in its aria attributes", () => {
		render(
			<StepThroughScrubber
				currentLine={42}
				totalLines={100}
				onScrub={jest.fn()}
			/>,
		);
		const slider = screen.getByRole("slider", { name: "G-code line" });
		expect(slider).toHaveAttribute("aria-valuemin", "1");
		expect(slider).toHaveAttribute("aria-valuemax", "100");
		expect(slider).toHaveAttribute("aria-valuenow", "42");
	});

	it.each([
		["ArrowLeft", -1],
		["ArrowRight", 1],
		["ArrowUp", 1],
		["ArrowDown", -1],
		["PageDown", -100],
		["PageUp", 100],
	])("moves by the expected delta on %s", (key, delta) => {
		const onScrub = jest.fn();
		const onScrubEnd = jest.fn();
		render(
			<StepThroughScrubber
				currentLine={500}
				totalLines={1000}
				onScrub={onScrub}
				onScrubEnd={onScrubEnd}
			/>,
		);
		fireEvent.keyDown(screen.getByRole("slider"), { key });
		expect(onScrub).toHaveBeenCalledWith(500 + delta);
		expect(onScrubEnd).toHaveBeenCalledWith(500 + delta);
	});

	it("jumps to line 1 on Home and totalLines on End", () => {
		const onScrub = jest.fn();
		render(
			<StepThroughScrubber
				currentLine={500}
				totalLines={1000}
				onScrub={onScrub}
			/>,
		);
		const slider = screen.getByRole("slider");

		fireEvent.keyDown(slider, { key: "Home" });
		expect(onScrub).toHaveBeenLastCalledWith(1);

		fireEvent.keyDown(slider, { key: "End" });
		expect(onScrub).toHaveBeenLastCalledWith(1000);
	});

	it("clamps a step below line 1 to line 1", () => {
		const onScrub = jest.fn();
		render(
			<StepThroughScrubber currentLine={1} totalLines={10} onScrub={onScrub} />,
		);
		fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowLeft" });
		expect(onScrub).toHaveBeenLastCalledWith(1);
	});

	it("clamps a step past the last line to totalLines", () => {
		const onScrub = jest.fn();
		render(
			<StepThroughScrubber
				currentLine={10}
				totalLines={10}
				onScrub={onScrub}
			/>,
		);
		fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
		expect(onScrub).toHaveBeenLastCalledWith(10);
	});

	it("resolves a pointer-down on the (zero-sized, in jsdom) track to currentLine", () => {
		const onScrub = jest.fn();
		render(
			<StepThroughScrubber
				currentLine={7}
				totalLines={50}
				onScrub={onScrub}
			/>,
		);
		const slider = screen.getByRole("slider");
		fireEvent.pointerDown(slider, { clientX: 123, pointerId: 1 });
		// jsdom's getBoundingClientRect on the inner track is always {width: 0},
		// which lineFromClientX treats as "can't compute a ratio" and reports
		// back whatever line we're already on rather than jumping to line 1.
		expect(onScrub).toHaveBeenCalledWith(7);
	});
});
