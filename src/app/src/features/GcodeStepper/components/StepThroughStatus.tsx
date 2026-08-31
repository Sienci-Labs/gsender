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

import { IMPERIAL_UNITS } from "app/constants";
import { cn } from "app/lib/utils";
import type React from "react";
import type { LineModalState, StepPosition } from "../definitions";

const MM_PER_INCH = 25.4;

interface StepThroughStatusProps {
	currentLine: number;
	totalLines: number;
	position: StepPosition;
	/** A is only shown when the loaded file actually contains rotary movement. */
	showAAxis: boolean;
	units: string;
	/** Modal state at the current line, or null while the index is still building. */
	modalState: LineModalState | null;
	/** Modal state at the line before it, used to mark what this line changed. */
	previousModalState: LineModalState | null;
}

const Block: React.FC<{
	label: string;
	className?: string;
	children: React.ReactNode;
}> = ({ label, className, children }) => (
	<div
		className={cn(
			"flex flex-col gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-outline dark:bg-surface-sunken",
			className,
		)}
	>
		<span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-content-muted">
			{label}
		</span>
		{children}
	</div>
);

const AxisReadout: React.FC<{ label: string; value: string }> = ({
	label,
	value,
}) => (
	<div className="flex items-baseline gap-1">
		<span className="text-xs text-gray-500 dark:text-content-muted">
			{label}
		</span>
		<span className="font-mono tabular-nums text-gray-900 dark:text-content-primary">
			{value}
		</span>
	</div>
);

/**
 * One modal word. `changed` marks a value this line actually altered, so
 * stepping onto a toolchange or a feed change is visible at a glance.
 */
const ModalWord: React.FC<{ value: string; changed: boolean }> = ({
	value,
	changed,
}) => (
	<span
		className={cn(
			"font-mono tabular-nums",
			changed
				? "font-bold text-blue-600 dark:text-blue-300"
				: "text-gray-700 dark:text-content-secondary",
		)}
	>
		{value}
	</span>
);

/** A number the file may never have set — NaN and null both mean "not shown". */
const isSet = (value: number | null | undefined): value is number =>
	value !== null && value !== undefined && Number.isFinite(value);

export const StepThroughStatus: React.FC<StepThroughStatusProps> = ({
	currentLine,
	totalLines,
	position,
	showAAxis,
	units,
	modalState,
	previousModalState,
}) => {
	// Index positions are always mm; convert only for display.
	const imperial = units === IMPERIAL_UNITS;
	const linear = (mm: number) =>
		imperial ? (mm / MM_PER_INCH).toFixed(4) : mm.toFixed(3);

	// Every word the file has actually set, paired with whether this line set it.
	const words: { key: string; value: string; changed: boolean }[] = [];
	if (modalState) {
		const { modals, feedRate, spindleSpeed } = modalState;
		const previous = previousModalState?.modals;

		const push = (
			key: string,
			value: string | null | undefined,
			changed: boolean,
		) => {
			if (value) {
				words.push({ key, value, changed });
			}
		};
		const differs = <K extends keyof typeof modals>(key: K) =>
			!!previous && previous[key] !== modals[key];

		push("motion", modals.motion, differs("motion"));
		push("distance", modals.distance, differs("distance"));
		push("units", modals.units, differs("units"));
		push("plane", modals.plane, differs("plane"));
		push("wcs", modals.coordinateSystem, differs("coordinateSystem"));
		push("spindle", modals.spindle, differs("spindle"));
		push("coolant", modals.coolant, differs("coolant"));
		if (isSet(modals.tool)) {
			push("tool", `T${modals.tool}`, differs("tool"));
		}
		if (isSet(feedRate)) {
			push(
				"feed",
				`F${feedRate}`,
				!!previousModalState && previousModalState.feedRate !== feedRate,
			);
		}
		if (isSet(spindleSpeed)) {
			push(
				"speed",
				`S${spindleSpeed}`,
				!!previousModalState &&
					previousModalState.spindleSpeed !== spindleSpeed,
			);
		}
	}

	return (
		<div className="flex flex-wrap items-stretch gap-2">
			<Block label="Current line">
				<span className="whitespace-nowrap font-mono tabular-nums text-gray-900 dark:text-content-primary">
					{currentLine.toLocaleString()}
					<span className="text-gray-500 dark:text-content-muted">
						{" / "}
						{totalLines.toLocaleString()}
					</span>
				</span>
			</Block>

			<Block label={`Position (Work, ${imperial ? "in" : "mm"})`}>
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
					<AxisReadout label="X" value={linear(position.x)} />
					<AxisReadout label="Y" value={linear(position.y)} />
					<AxisReadout label="Z" value={linear(position.z)} />
					{showAAxis && (
						<AxisReadout label="A" value={`${position.a.toFixed(3)}°`} />
					)}
				</div>
			</Block>

			<Block label="Modals" className="min-w-[14rem] flex-1">
				{words.length === 0 ? (
					<span className="text-xs text-gray-500 dark:text-content-muted">
						—
					</span>
				) : (
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
						{words.map((word) => (
							<ModalWord
								key={word.key}
								value={word.value}
								changed={word.changed}
							/>
						))}
					</div>
				)}
			</Block>
		</div>
	);
};

export default StepThroughStatus;
