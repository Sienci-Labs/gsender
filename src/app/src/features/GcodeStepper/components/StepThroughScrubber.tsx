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

/**
 * Media-timeline style scrubber over the whole file.
 *
 * The track itself is the drag surface and is padded out to a 44px-tall hit
 * area, so the thumb never has to be hit precisely on a touchscreen.
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

	return (
		<div className="flex flex-col gap-1">
			<div
				ref={trackRef}
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
				className="relative flex h-11 cursor-pointer touch-none select-none items-center focus-visible:outline-none"
			>
				{/* Track */}
				<div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-surface-sunken">
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
						style={{ width: `${progress}%` }}
					/>
					{/* Thumb — visual only; the whole track is the hit area. */}
					<div
						className={cn(
							"pointer-events-none absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow",
							"border-blue-500 dark:bg-content-primary",
							dragging && "scale-110",
						)}
						style={{ left: `${progress}%` }}
					/>
				</div>
			</div>

			{/* Tick marks */}
			<div
				aria-hidden="true"
				className="flex h-2 w-full items-start justify-between px-[2px]"
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

			<div className="flex items-baseline justify-between text-xs text-gray-500 dark:text-content-muted">
				<span>1</span>
				<span className="text-base text-gray-900 dark:text-content-primary">
					<span className="font-bold tabular-nums">
						{currentLine.toLocaleString()}
					</span>
					<span className="text-gray-500 dark:text-content-muted">
						{" / "}
						{totalLines.toLocaleString()}
					</span>
				</span>
				<span>{totalLines.toLocaleString()}</span>
			</div>

			<span className="text-center text-xs text-gray-500 dark:text-content-muted">
				Scrub the timeline or use step controls to navigate through the file.
			</span>
		</div>
	);
};

export default StepThroughScrubber;
