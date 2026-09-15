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

import { act, fireEvent, render, screen } from "@testing-library/react";
import { JogWheel } from "../JogWheel";

// Mock-prefixed so babel-plugin-jest-hoist allows the jest.mock() factory below
// (hoisted above this declaration) to close over it.
const mockCommand = jest.fn();

jest.mock("app/lib/controller", () => ({
	__esModule: true,
	default: {
		command: (...args: unknown[]) => mockCommand(...args),
	},
}));

jest.mock("app/store", () => ({
	__esModule: true,
	default: { get: (_key: string, fallback: unknown) => fallback },
}));

jest.mock("@posthog/react", () => ({
	usePostHog: () => null,
}));

jest.mock("app/hooks/useWorkspaceState", () => ({
	useWorkspaceState: () => ({ mode: "DEFAULT" }),
}));

const THRESHOLD = 200;

const renderWheel = () =>
	render(
		<JogWheel canClick feedrate={1000} distance={1} threshold={THRESHOLD} />,
	);

const commandsNamed = (name: string) =>
	mockCommand.mock.calls.filter((call) => call[0] === name);

beforeEach(() => {
	jest.useFakeTimers();
	mockCommand.mockClear();
});

afterEach(() => {
	jest.useRealTimers();
});

describe("JogWheel continuous jog release", () => {
	it("stops the jog when the browser cancels the pointer", () => {
		renderWheel();
		const wedge = screen.getByLabelText("Jog X plus");

		fireEvent.pointerDown(wedge, { button: 0 });
		act(() => {
			jest.advanceTimersByTime(THRESHOLD + 10);
		});
		expect(commandsNamed("jog:start")).toHaveLength(1);

		// A cancelled pointer never produces the pointerup that use-long-press
		// listens for, so without our own handler the machine would keep going.
		fireEvent.pointerCancel(wedge);

		expect(commandsNamed("jog:stop")).toHaveLength(1);
	});

	it("still stops on an ordinary release", () => {
		renderWheel();
		const wedge = screen.getByLabelText("Jog X plus");

		fireEvent.pointerDown(wedge, { button: 0 });
		act(() => {
			jest.advanceTimersByTime(THRESHOLD + 10);
		});
		fireEvent.pointerUp(wedge);

		expect(commandsNamed("jog:start")).toHaveLength(1);
		expect(commandsNamed("jog:stop")).toHaveLength(1);
	});

	it("treats a press shorter than the threshold as a single step jog", () => {
		renderWheel();
		const wedge = screen.getByLabelText("Jog X plus");

		fireEvent.pointerDown(wedge, { button: 0 });
		act(() => {
			jest.advanceTimersByTime(THRESHOLD / 2);
		});
		fireEvent.pointerUp(wedge);

		expect(commandsNamed("jog:start")).toHaveLength(0);
		expect(commandsNamed("gcode")).toHaveLength(1);
	});

	it("ignores a secondary-button press so no jog is left running", () => {
		renderWheel();
		const wedge = screen.getByLabelText("Jog X plus");

		// The context menu swallows the release, so a right-click must never
		// start a jog in the first place. Dispatched as a MouseEvent because
		// jsdom has no PointerEvent, and fireEvent's fallback plain Event drops
		// the `button` this case is entirely about.
		fireEvent(
			wedge,
			new MouseEvent("pointerdown", { bubbles: true, button: 2 }),
		);
		act(() => {
			jest.advanceTimersByTime(THRESHOLD + 10);
		});

		expect(commandsNamed("jog:start")).toHaveLength(0);
	});
});
