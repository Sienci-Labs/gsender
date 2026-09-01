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

import { cn } from "app/lib/utils";
import type React from "react";
import { useCallback, useRef, useState } from "react";

interface ScrubberProps {
	currentLine: number;
	totalLines: number;
	/** Fires continuously while dragging. */
	onScrub: (line: number) => void;
	/** Fires once the drag ends, for any work too costly to do per-pointermove. */
	onScrubEnd?: (line: number) => void;
}

const TICK_COUNT = 40;

// Half the handle's ~48px width: the row is inset by this so the handle
// stays fully visible at line 1 and at the last line.
const THUMB_INSET = "px-6";

/**
 * Media-timeline style scrubber over the whole file.
 *
 * The whole 44px-tall row is the drag surface, so the thumb never has to be hit
 * precisely on a touchscreen. The row is inset by the thumb's radius and the
 * pointer maths measures the inset track, so the thumb stays fully on screen at
 * both ends of the file — these two have to move together or the rendered
 * progress and the pointer position drift apart.
 */
export const StepThroughScrubber: React.FC<ScrubberProps> = ({
	currentLine,
	totalLines,
	onScrub,
	onScrubEnd,
}) => {
	const trackRef = useRef<HTMLDivElement>(null);
	const [dragging, setDragging] = useState(false);

	const lineFromClientX = useCallback(
		(clientX: number): number => {
			const track = trackRef.current;
			if (!track || totalLines <= 1) {
				return 1;
			}
			const rect = track.getBoundingClientRect();
			if (rect.width === 0) {
				return currentLine;
			}
			const ratio = (clientX - rect.left) / rect.width;
			const clamped = Math.min(1, Math.max(0, ratio));
			return Math.round(clamped * (totalLines - 1)) + 1;
		},
		[currentLine, totalLines],
	);

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		e.currentTarget.setPointerCapture(e.pointerId);
		setDragging(true);
		onScrub(lineFromClientX(e.clientX));
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!dragging) {
			return;
		}
		onScrub(lineFromClientX(e.clientX));
	};

	const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!dragging) {
			return;
		}
		setDragging(false);
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
		onScrubEnd?.(lineFromClientX(e.clientX));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const deltas: Record<string, number> = {
			ArrowLeft: -1,
			ArrowRight: 1,
			ArrowDown: -1,
			ArrowUp: 1,
			PageDown: -100,
			PageUp: 100,
		};
		let next: number | null = null;
		if (e.key === "Home") {
			next = 1;
		} else if (e.key === "End") {
			next = totalLines;
		} else if (deltas[e.key] !== undefined) {
			next = currentLine + deltas[e.key];
		}
		if (next === null) {
			return;
		}
		e.preventDefault();
		const clamped = Math.min(totalLines, Math.max(1, next));
		onScrub(clamped);
		onScrubEnd?.(clamped);
	};

	const progress =
		totalLines > 1 ? ((currentLine - 1) / (totalLines - 1)) * 100 : 0;

	// 0/25/50/75/100% of the file, lining up with the taller ticks below.
	const quarterLabels = [0, 0.25, 0.5, 0.75, 1].map((fraction) =>
		Math.max(1, Math.round(fraction * totalLines) || 1),
	);

	return (
		<div className="flex flex-col gap-1">
			<div
				role="slider"
				tabIndex={0}
				aria-label="G-code line"
				aria-valuemin={1}
				aria-valuemax={totalLines}
				aria-valuenow={currentLine}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={endDrag}
				onPointerCancel={endDrag}
				onKeyDown={handleKeyDown}
				className={cn(
					"relative flex h-12 cursor-pointer touch-none select-none items-center",
					"focus-visible:outline-none",
					THUMB_INSET,
				)}
			>
				{/* Track — thick rounded capsule, sized as a normal-flow child so it's
				    naturally inset by the row's THUMB_INSET padding. It's also the
				    positioning context for the handle below: percentages on an
				    absolutely-positioned child resolve against a padded ancestor's
				    full box (ignoring that ancestor's own padding), so the handle
				    must be positioned relative to this un-padded track — not the
				    padded row — or its 0%/100% ends up flush with the row's true
				    outer edge instead of the track's inset edge. */}
				<div
					ref={trackRef}
					className="relative h-6 w-full rounded-full border border-gray-300 bg-gray-200 dark:border-outline dark:bg-surface-sunken"
				>
					{/* Clips only the fill's corners — an overflow-hidden here would
					    also clip the taller handle. */}
					<div className="absolute inset-0 overflow-hidden rounded-full">
						<div
							className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
							style={{ width: `${progress}%` }}
						/>
					</div>

					{/* Handle — a vertical pill overlapping the track, not a circular
					    thumb inside it. Taller than the track so it reads as the
					    obvious grip target; the whole row is still the hit area, this
					    is purely visual. */}
					<div
						className={cn(
							"pointer-events-none absolute top-1/2 h-12 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500 bg-white shadow dark:border-blue-400 dark:bg-white",
							"flex items-center justify-center gap-1",
							dragging && "shadow-md ring-2 ring-blue-500/30",
						)}
						style={{ left: `${progress}%` }}
					>
						<span className="h-4 w-px bg-gray-400" />
						<span className="h-4 w-px bg-gray-400" />
						<span className="h-4 w-px bg-gray-400" />
					</div>
				</div>
			</div>

			{/* Tick marks — every tenth is taller and lands on a quarter label. */}
			<div
				aria-hidden="true"
				className={cn(
					"flex h-2 w-full items-start justify-between",
					THUMB_INSET,
				)}
			>
				{Array.from({ length: TICK_COUNT + 1 }, (_, i) => (
					<span
						key={i}
						className={cn(
							"w-px bg-gray-300 dark:bg-outline-subtle",
							i % 10 === 0 ? "h-2" : "h-1",
						)}
					/>
				))}
			</div>

			{/* Quarter labels, pinned to the same track positions as the ticks. The
			    outer two are clamped inward so neither can clip. */}
			<div className={cn("relative h-4", THUMB_INSET)}>
				{quarterLabels.map((line, i) => (
					<span
						// Positional, not by value: a short file repeats line numbers
						// across quarters.
						key={i}
						style={{ left: `${i * 25}%` }}
						className={cn(
							"absolute top-0 whitespace-nowrap text-xs tabular-nums text-gray-500 dark:text-content-muted",
							i === 0 && "translate-x-0",
							i > 0 && i < 4 && "-translate-x-1/2",
							i === 4 && "-translate-x-full",
						)}
					>
						{line.toLocaleString()}
					</span>
				))}
			</div>

			<div className="text-center text-sm text-gray-500 dark:text-content-muted">
				<span className="font-semibold tabular-nums text-gray-700 dark:text-content-secondary">
					{currentLine.toLocaleString()}
				</span>
				{" / "}
				{totalLines.toLocaleString()}
			</div>
		</div>
	);
};

export default StepThroughScrubber;
