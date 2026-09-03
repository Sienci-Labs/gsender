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

import type { LinePositionIndex, StepperTool } from "../../definitions";

// buildStepperTools pulls in app/features/ATC/components/ToolTimeline for
// buildToolArray, which at module scope drags in `controller` (real
// serial/socket client) and pubsub-js — none of that is relevant to testing
// tools.ts's own post-processing (diameter parsing, spindle-speed lookup,
// the no-toolchange fallback), so the whole module is replaced with a
// minimal stub.
jest.mock("app/features/ATC/components/ToolTimeline", () => ({
	buildToolArray: jest.fn(),
}));
jest.mock("app/lib/getVisualizerTheme", () => ({
	getVisualizerTheme: jest.fn(),
}));

import { buildToolArray } from "app/features/ATC/components/ToolTimeline";
import { getVisualizerTheme } from "app/lib/getVisualizerTheme";
import {
	activeToolIndexForLine,
	buildStepperTools,
	buildToolFrameGroups,
	parseToolDiameter,
	readableTextColor,
} from "../tools";

const mockBuildToolArray = buildToolArray as jest.Mock;
const mockGetVisualizerTheme = getVisualizerTheme as jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
	// A stand-in for the real theme Map — buildStepperTools only ever calls
	// `.get(G1_PART)` on it, so the key doesn't need to match the real constant.
	mockGetVisualizerTheme.mockReturnValue({ get: () => "#3e85c7" });
});

describe("parseToolDiameter", () => {
	it("reads a Fusion-style 'D=' diameter", () => {
		expect(parseToolDiameter("T1 D=6. CR=0. - flat end mill")).toBe(6);
	});

	it("reads an explicit mm diameter", () => {
		expect(parseToolDiameter("6mm endmill")).toBe(6);
	});

	it("reads a fractional inch diameter, converted to mm", () => {
		expect(parseToolDiameter('1/4" endmill')).toBeCloseTo(6.35, 4);
	});

	it("reads a decimal inch diameter, converted to mm", () => {
		expect(parseToolDiameter("0.25 inch endmill")).toBeCloseTo(6.35, 4);
	});

	it("returns undefined for no comment or no match", () => {
		expect(parseToolDiameter(undefined)).toBeUndefined();
		expect(parseToolDiameter("just a plain comment")).toBeUndefined();
	});
});

describe("readableTextColor", () => {
	it("picks black text on a light background", () => {
		expect(readableTextColor("#ffff00")).toBe("#000000");
	});

	it("picks white text on a dark background", () => {
		expect(readableTextColor("#000080")).toBe("#ffffff");
	});

	it("expands a 3-digit hex shorthand", () => {
		expect(readableTextColor("#fff")).toBe("#000000");
	});

	it("falls back to white for malformed input", () => {
		expect(readableTextColor("not-a-color")).toBe("#ffffff");
	});
});

describe("activeToolIndexForLine", () => {
	const tools: StepperTool[] = [
		{
			index: 1,
			toolNumber: 1,
			label: "T1",
			color: "#111111",
			startLine: 1,
			endLine: 10,
		},
		{
			index: 2,
			toolNumber: 2,
			label: "T2",
			color: "#222222",
			startLine: 11,
			endLine: 20,
		},
	];

	it("returns -1 for an empty tool list", () => {
		expect(activeToolIndexForLine([], 5)).toBe(-1);
	});

	it("returns -1 before the first tool's range", () => {
		// Not reachable given buildStepperTools always starts at line 1, but the
		// function itself should still handle it rather than assume.
		const shifted: StepperTool[] = [{ ...tools[0], startLine: 5 }];
		expect(activeToolIndexForLine(shifted, 1)).toBe(-1);
	});

	it("finds the right tool for a line in each range", () => {
		expect(activeToolIndexForLine(tools, 1)).toBe(0);
		expect(activeToolIndexForLine(tools, 10)).toBe(0);
		expect(activeToolIndexForLine(tools, 11)).toBe(1);
		expect(activeToolIndexForLine(tools, 20)).toBe(1);
	});
});

describe("buildToolFrameGroups", () => {
	const index: LinePositionIndex = {
		lineCount: 20,
		positions: new Float32Array(20 * 4),
		frameForLine: Int32Array.from({ length: 20 }, (_, i) => i + 1),
		modalTable: [],
		modalForLine: new Uint16Array(20),
		feedRates: new Float32Array(20),
		spindleSpeeds: new Float32Array(20),
	};
	const tools: StepperTool[] = [
		{
			index: 1,
			toolNumber: 1,
			label: "T1",
			color: "#111111",
			startLine: 1,
			endLine: 10,
		},
		{
			index: 2,
			toolNumber: 2,
			label: "T2",
			color: "#222222",
			startLine: 11,
			endLine: 20,
		},
	];

	it("returns undefined when there's no index or no tools", () => {
		expect(buildToolFrameGroups(tools, null)).toBeUndefined();
		expect(buildToolFrameGroups([], index)).toBeUndefined();
	});

	it("computes frame ranges, with the first tool starting at frame 0", () => {
		const groups = buildToolFrameGroups(tools, index);
		expect(groups).toEqual([
			{ start: 0, end: 9 }, // startLine 1 -> 0; endLine 10 -> frame 10 - 1
			{ start: 10, end: 19 }, // startLine 11 -> frameAtLine(10) = 10; endLine 20 -> 20-1
		]);
	});
});

describe("buildStepperTools", () => {
	it("returns [] when there are no toolchanges and no toolSet", () => {
		mockBuildToolArray.mockReturnValue([]);
		expect(buildStepperTools({}, 100)).toEqual([]);
	});

	it("builds a single synthetic tool spanning the whole file when only toolSet is known", () => {
		mockBuildToolArray.mockReturnValue([]);
		const tools = buildStepperTools({}, 100, ["T3"]);
		expect(tools).toEqual([
			expect.objectContaining({
				index: 1,
				toolNumber: 3,
				label: "T3",
				startLine: 1,
				endLine: 100,
			}),
		]);
	});

	it("maps each real toolchange, parsing diameter and picking spindle speed", () => {
		mockBuildToolArray.mockReturnValue([
			{
				toolNumber: 1,
				startLine: 1,
				endLine: 50,
				label: "T1",
				color: "#aaaaaa",
				comment: "6mm endmill",
			},
			{
				toolNumber: 2,
				startLine: 51,
				endLine: 100,
				label: "T2",
				color: "#bbbbbb",
			},
		]);

		const spindleToolEvents = {
			"1": { T: 1, M: 6, S: 12000 },
			"51": { T: 2, M: 6, S: 18000 },
		};

		const tools = buildStepperTools(spindleToolEvents, 100);

		expect(tools).toEqual([
			expect.objectContaining({
				toolNumber: 1,
				diameter: 6,
				spindleSpeed: 12000,
				startLine: 1,
				endLine: 50,
			}),
			expect.objectContaining({
				toolNumber: 2,
				diameter: undefined,
				spindleSpeed: 18000,
				startLine: 51,
				endLine: 100,
			}),
		]);
	});
});
