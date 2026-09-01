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

import type { ModalState } from "@sienci/gviewer";
import type { LinePositionIndex } from "../../definitions";
import {
	buildLinePositionIndex,
	frameAtLine,
	modalsAtLine,
	positionAtLine,
} from "../linePositionIndex";

// Minimal hand-built index: 3 lines, two distinct modal-table entries. Line 1
// uses table entry 0, lines 2-3 use entry 1 — exercises "line changed modals"
// without depending on buildLinePositionIndex to construct it.
function makeFixtureIndex(): LinePositionIndex {
	const modalTable: ModalState[] = [
		{ motion: "G0" } as ModalState,
		{ motion: "G1" } as ModalState,
	];
	return {
		lineCount: 3,
		positions: Float32Array.from([
			0, 0, 0, 0, // line 1
			10, 0, 0, 0, // line 2
			10, 10, 0, 0, // line 3
		]),
		frameForLine: Int32Array.from([1, 2, 3]),
		modalTable,
		modalForLine: Uint16Array.from([0, 1, 1]),
		feedRates: Float32Array.from([Number.NaN, 500, 500]),
		spindleSpeeds: Float32Array.from([Number.NaN, Number.NaN, Number.NaN]),
	};
}

describe("modalsAtLine / frameAtLine / positionAtLine", () => {
	it("return the null/zero defaults when there is no index", () => {
		expect(modalsAtLine(null, 1)).toBeNull();
		expect(frameAtLine(null, 1)).toBe(0);
		expect(positionAtLine(null, 1)).toEqual({ x: 0, y: 0, z: 0, a: 0 });
	});

	it("return the null/zero defaults for an empty index", () => {
		const empty: LinePositionIndex = {
			lineCount: 0,
			positions: new Float32Array(0),
			frameForLine: new Int32Array(0),
			modalTable: [],
			modalForLine: new Uint16Array(0),
			feedRates: new Float32Array(0),
			spindleSpeeds: new Float32Array(0),
		};
		expect(modalsAtLine(empty, 1)).toBeNull();
		expect(frameAtLine(empty, 1)).toBe(0);
		expect(positionAtLine(empty, 1)).toEqual({ x: 0, y: 0, z: 0, a: 0 });
	});

	it("looks up an in-range line correctly", () => {
		const index = makeFixtureIndex();
		expect(positionAtLine(index, 2)).toEqual({ x: 10, y: 0, z: 0, a: 0 });
		expect(frameAtLine(index, 2)).toBe(2);
		expect(modalsAtLine(index, 2)?.modals.motion).toBe("G1");
		expect(modalsAtLine(index, 2)?.feedRate).toBe(500);
	});

	it("clamps out-of-range line numbers to the first/last line", () => {
		const index = makeFixtureIndex();
		// Below range clamps to line 1.
		expect(positionAtLine(index, 0)).toEqual({ x: 0, y: 0, z: 0, a: 0 });
		expect(positionAtLine(index, -50)).toEqual({ x: 0, y: 0, z: 0, a: 0 });
		expect(frameAtLine(index, 0)).toBe(1);
		expect(modalsAtLine(index, 0)?.modals.motion).toBe("G0");
		// Above range clamps to the last line.
		expect(positionAtLine(index, 999)).toEqual({ x: 10, y: 10, z: 0, a: 0 });
		expect(frameAtLine(index, 999)).toBe(3);
		expect(modalsAtLine(index, 999)?.modals.motion).toBe("G1");
	});
});

describe("buildLinePositionIndex", () => {
	it("tracks position sequentially, carrying it forward on a non-motion line", async () => {
		const lines = ["G1 X10 Y0 F1000", "M5", "G1 X10 Y10"];
		const index = await buildLinePositionIndex(lines);

		expect(index).not.toBeNull();
		expect(positionAtLine(index, 1)).toEqual({ x: 10, y: 0, z: 0, a: 0 });
		// M5 doesn't move the tool — position carries forward from line 1.
		expect(positionAtLine(index, 2)).toEqual({ x: 10, y: 0, z: 0, a: 0 });
		expect(positionAtLine(index, 3)).toEqual({ x: 10, y: 10, z: 0, a: 0 });
	});

	it("does not advance the frame counter for a comment-only line", async () => {
		const lines = ["G1 X10", "(just a comment)", "G1 X20"];
		const index = await buildLinePositionIndex(lines);

		expect(index).not.toBeNull();
		// Frame count reached at line 1 and line 3 differ by exactly one motion
		// line's worth — the comment in between contributed nothing.
		expect(frameAtLine(index, 1)).toBe(1);
		expect(frameAtLine(index, 3)).toBe(2);
	});

	it("honors blankLineEmitsFrame for whether a blank line advances the frame count", async () => {
		const lines = ["G1 X10", "", "G1 X20"];

		const withBlankFrame = await buildLinePositionIndex(lines, {
			blankLineEmitsFrame: true,
		});
		expect(frameAtLine(withBlankFrame, 2)).toBe(2);
		expect(frameAtLine(withBlankFrame, 3)).toBe(3);

		const withoutBlankFrame = await buildLinePositionIndex(lines, {
			blankLineEmitsFrame: false,
		});
		expect(frameAtLine(withoutBlankFrame, 2)).toBe(1);
		expect(frameAtLine(withoutBlankFrame, 3)).toBe(2);
	});

	it("carries state forward across a malformed line instead of throwing", async () => {
		const lines = ["G1 X10 Y10", "!!! not gcode ???", "G1 X20 Y20"];

		await expect(buildLinePositionIndex(lines)).resolves.not.toBeNull();
		const index = await buildLinePositionIndex(lines);
		expect(positionAtLine(index, 2)).toEqual({ x: 10, y: 10, z: 0, a: 0 });
		expect(positionAtLine(index, 3)).toEqual({ x: 20, y: 20, z: 0, a: 0 });
	});

	it("reports progress mid-build and supports aborting before completion", async () => {
		jest.useFakeTimers();
		try {
			// Real LINES_PER_CHUNK (20,000) — large enough to force at least one
			// yield/progress callback before the file finishes.
			const lineCount = 20005;
			const lines = Array.from({ length: lineCount }, () => "G1 X1");

			const onProgress = jest.fn();
			const shouldAbort = jest.fn(() => false);
			const buildPromise = buildLinePositionIndex(lines, {
				onProgress,
				shouldAbort,
			});

			await jest.runAllTimersAsync();
			const index = await buildPromise;

			expect(index).not.toBeNull();
			expect(onProgress).toHaveBeenCalledWith(20000, lineCount);
			expect(onProgress).toHaveBeenCalledWith(lineCount, lineCount);
		} finally {
			jest.useRealTimers();
		}
	});

	it("resolves to null when shouldAbort becomes true mid-build", async () => {
		jest.useFakeTimers();
		try {
			const lineCount = 20005;
			const lines = Array.from({ length: lineCount }, () => "G1 X1");

			const buildPromise = buildLinePositionIndex(lines, {
				shouldAbort: () => true,
			});

			await jest.runAllTimersAsync();
			const index = await buildPromise;

			expect(index).toBeNull();
		} finally {
			jest.useRealTimers();
		}
	});
});
