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

import type { LineRangeGroup } from "@sienci/gviewer/viewer";
import { buildToolArray } from "app/features/ATC/components/ToolTimeline";
import { G1_PART } from "app/features/Visualizer/constants";
import { getVisualizerTheme } from "app/lib/getVisualizerTheme";
import type { LinePositionIndex, StepperTool } from "../definitions";
import { frameAtLine } from "./linePositionIndex";

const MM_PER_INCH = 25.4;

// Diameter as posted by Fusion 360 and friends: "T1 D=6. CR=0. - flat end mill".
const DIAMETER_EQUALS = /\bD\s*=\s*(\d+(?:\.\d*)?)/i;
// Explicit metric diameter: "6mm endmill", "3.175 mm".
const DIAMETER_MM = /(\d+(?:\.\d*)?)\s*mm\b/i;
// Fractional inch: `1/4"`, "1/8 inch endmill".
const DIAMETER_FRACTION_INCH = /(\d+)\s*\/\s*(\d+)\s*(?:"|''|in\b|inch\b)/i;
// Decimal inch: `0.25"`, "0.125 inch".
const DIAMETER_DECIMAL_INCH = /(\d+(?:\.\d*)?)\s*(?:"|''|in\b|inch\b)/i;

/**
 * Best-effort tool diameter, in mm, read out of a toolchange comment.
 *
 * Nothing in gSender parses tool geometry, but most posts describe the tool in
 * the comment on the toolchange line. Returns undefined when no pattern
 * matches — the caller omits the field rather than inventing a default.
 */
export function parseToolDiameter(comment?: string): number | undefined {
	if (!comment) {
		return undefined;
	}

	const equals = comment.match(DIAMETER_EQUALS);
	if (equals) {
		return finite(Number(equals[1]));
	}

	const mm = comment.match(DIAMETER_MM);
	if (mm) {
		return finite(Number(mm[1]));
	}

	const fraction = comment.match(DIAMETER_FRACTION_INCH);
	if (fraction) {
		const denominator = Number(fraction[2]);
		if (denominator > 0) {
			return finite((Number(fraction[1]) / denominator) * MM_PER_INCH);
		}
	}

	const inch = comment.match(DIAMETER_DECIMAL_INCH);
	if (inch) {
		return finite(Number(inch[1]) * MM_PER_INCH);
	}

	return undefined;
}

const finite = (value: number): number | undefined =>
	Number.isFinite(value) && value > 0 ? value : undefined;

type SpindleToolEvent = {
	T?: number;
	M?: number;
	S?: number;
	comment?: string;
};

/**
 * The last spindle speed commanded at or before `line`. Posts usually set S on
 * or just after the toolchange, so also look a short way ahead before giving up.
 */
function spindleSpeedForTool(
	events: Record<string, SpindleToolEvent>,
	line: number,
	endLine: number,
): number | undefined {
	let best: number | undefined;
	let bestDistance = Infinity;

	for (const [key, event] of Object.entries(events)) {
		if (event?.S === undefined) {
			continue;
		}
		const eventLine = Number(key);
		if (eventLine > endLine) {
			continue;
		}
		// Prefer the closest S to the toolchange, favouring earlier lines on ties.
		const distance = Math.abs(eventLine - line);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = event.S;
		}
	}

	return finite(Number(best));
}

/**
 * Tools used by the loaded file, in the order the file switches to them.
 *
 * Reuses ToolTimeline's toolchange grouping so the palette colour on each card
 * matches the colour that tool's paths are drawn in, then layers on the extra
 * metadata the step-through panel shows.
 */
export function buildStepperTools(
	spindleToolEvents: Record<string, SpindleToolEvent> | undefined,
	totalLines: number,
	toolSet: string[] = [],
): StepperTool[] {
	const cuttingColor = getVisualizerTheme().get(G1_PART) ?? "#3e85c7";
	const events = spindleToolEvents ?? {};
	const toolChanges = buildToolArray(events, totalLines, cuttingColor);

	if (toolChanges.length === 0) {
		// No M6 toolchange in the file. If a T word was still seen, the whole
		// program runs on that one tool.
		const first = toolSet[0];
		if (!first) {
			return [];
		}
		const toolNumber = Number(String(first).replace(/^T/i, ""));
		return [
			{
				index: 1,
				toolNumber: Number.isFinite(toolNumber) ? toolNumber : 0,
				label: String(first).toUpperCase(),
				color: cuttingColor,
				startLine: 1,
				endLine: totalLines,
				spindleSpeed: spindleSpeedForTool(events, 1, totalLines),
			},
		];
	}

	return toolChanges.map((tool, i) => {
		const startLine = tool.startLine ?? 1;
		const endLine = tool.endLine ?? totalLines;
		return {
			index: tool.index ?? i + 1,
			toolNumber: tool.toolNumber,
			label: tool.label ?? `T${tool.toolNumber}`,
			color: tool.color ?? cuttingColor,
			startLine,
			endLine,
			comment: tool.comment,
			diameter: parseToolDiameter(tool.comment),
			spindleSpeed: spindleSpeedForTool(events, startLine, endLine),
		};
	});
}

/**
 * Converts each tool's line span into the frame ranges gviewer hides by.
 *
 * The two are not the same coordinate: the visualize worker emits a frame per
 * line it actually parses, skipping comment-only lines, so a tool's 1-based
 * line span drifts from its frame span by however many comments precede it.
 * `frameForLine` (via `frameAtLine`) is the running frame *count* through a
 * line, so the first frame of a tool is the count reached by the line before
 * it, and its last is one below the count reached by its own final line.
 *
 * Returns undefined when there is nothing to group, so the viewer loads the
 * toolpath as a single pair of streams exactly as it did before.
 */
export function buildToolFrameGroups(
	tools: readonly StepperTool[],
	index: LinePositionIndex | null,
): LineRangeGroup[] | undefined {
	if (!index || tools.length === 0) {
		return undefined;
	}
	return tools.map((tool) => ({
		start: tool.startLine <= 1 ? 0 : frameAtLine(index, tool.startLine - 1),
		end: frameAtLine(index, tool.endLine) - 1,
	}));
}

/** Index into `tools` of the tool active at `line`, or -1 when none is. */
export function activeToolIndexForLine(
	tools: StepperTool[],
	line: number,
): number {
	for (let i = 0; i < tools.length; i++) {
		if (line >= tools[i].startLine && line <= tools[i].endLine) {
			return i;
		}
	}
	// Before the first toolchange nothing is cutting yet.
	return -1;
}

/** Linearise one 0-255 sRGB channel for the luminance sum. */
const linearise = (channel: number): number => {
	const c = channel / 255;
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/**
 * Black or white, whichever contrasts better on top of `hex`.
 *
 * The toolpath palette (TOOLPATH_COLOR_HEXES) is mostly mid-tones — oranges,
 * mid blues, magentas — plus some genuinely light greens and golds. White alone
 * clears 4.5:1 on none of it, so hard-coding a foreground is not an option.
 * Rather than pick on a luminance threshold (easy to set wrong: anything above
 * ~0.18 already favours black), compute the actual WCAG contrast ratio against
 * both and take the winner. Over the full palette that never drops below 4.5:1.
 */
export function readableTextColor(hex: string): string {
	const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex?.trim() ?? "");
	if (!match) {
		return "#ffffff";
	}

	let digits = match[1];
	if (digits.length === 3) {
		digits = digits
			.split("")
			.map((d) => d + d)
			.join("");
	}

	const r = Number.parseInt(digits.slice(0, 2), 16);
	const g = Number.parseInt(digits.slice(2, 4), 16);
	const b = Number.parseInt(digits.slice(4, 6), 16);
	const luminance =
		0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);

	// WCAG contrast: (lighter + 0.05) / (darker + 0.05). White has luminance 1,
	// black 0, so these reduce to the two expressions below.
	const againstWhite = 1.05 / (luminance + 0.05);
	const againstBlack = (luminance + 0.05) / 0.05;

	return againstBlack >= againstWhite ? "#000000" : "#ffffff";
}
