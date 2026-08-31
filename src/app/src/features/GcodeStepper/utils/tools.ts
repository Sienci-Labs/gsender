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

import { buildToolArray } from "app/features/ATC/components/ToolTimeline";
import { G1_PART } from "app/features/Visualizer/constants";
import { getVisualizerTheme } from "app/lib/getVisualizerTheme";
import type { StepperTool } from "../definitions";

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
