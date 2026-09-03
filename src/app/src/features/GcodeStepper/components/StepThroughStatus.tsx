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
import { Eye, EyeOff } from "lucide-react";
import type React from "react";
import type { LineModalState, StepPosition } from "../definitions";

const MM_PER_INCH = 25.4;

interface StepThroughStatusProps {
	position: StepPosition;
	/** A is only shown when the loaded file actually contains rotary movement. */
	showAAxis: boolean;
	units: string;
	/** Modal state at the current line, or null while the index is still building. */
	modalState: LineModalState | null;
	/** Modal state at the line before it, used to mark what this line changed. */
	previousModalState: LineModalState | null;
	/** Whether processed geometry is hidden outright rather than greyed. */
	hideProcessed: boolean;
	onToggleHideProcessed: () => void;
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
		{/* Fixed-width and right-aligned: without this the bar reflows on every
		    step as values cross a digit or pick up a minus sign. `ch` is exact
		    under font-mono, and 9 of them hold the widest realistic readout
		    ("-9999.999", or "-360.000°" for A). */}
		<span className="inline-block w-[9ch] text-right font-mono tabular-nums text-blue-500 dark:text-blue-400">
			{value}
		</span>
	</div>
);

/**
 * One modal group. `changed` marks a value this line actually altered, so
 * stepping onto a toolchange or a feed change is visible at a glance.
 */
const ModalCell: React.FC<{
	label: string;
	value: string;
	changed: boolean;
}> = ({ label, value, changed }) => (
	<div
		className={cn(
			"flex flex-col items-center rounded border px-1 py-0.5 transition-colors",
			// The whole cell lights up, not just the value — a single bolded code
			// among eleven is easy to miss while stepping.
			changed
				? "border-blue-500 bg-blue-500/20"
				: "border-gray-200 dark:border-outline/70",
		)}
	>
		<span
			className={cn(
				"text-[10px] uppercase tracking-wide",
				changed
					? "text-blue-700 dark:text-blue-200"
					: "text-gray-500 dark:text-content-muted",
			)}
		>
			{label}
		</span>
		<span
			className={cn(
				"font-mono text-sm tabular-nums",
				changed
					? "font-bold text-blue-700 dark:text-blue-200"
					: "text-gray-700 dark:text-content-secondary",
			)}
		>
			{value}
		</span>
	</div>
);

/** A number the file may never have set — NaN and null both mean "unset". */
const isSet = (value: number | null | undefined): value is number =>
	value !== null && value !== undefined && Number.isFinite(value);

// Feed/speed can arrive with long float-conversion tails (e.g. an imperial
// file's mm-per-inch division) — round to 2 decimals and drop trailing zeros
// so the modal cell shows a sane number instead of busting out of its box.
const roundModalNumber = (value: number): number =>
	Number(value.toFixed(2));

/**
 * The modal state as GRBL's `$G` would report it.
 *
 * gviewer's DEFAULT_MODALS leaves spindle, coolant, tool, feed and speed null
 * until the file sets them, but a real controller always has a value for each —
 * `M5 M9 T0 F0 S0` at power-on. Substituting those keeps every group present
 * instead of having cells appear and disappear as the file progresses.
 */
function grblModals(state: LineModalState | null) {
	if (!state) {
		return null;
	}
	const { modals, feedRate, spindleSpeed } = state;
	return {
		motion: modals.motion,
		coordinateSystem: modals.coordinateSystem,
		plane: modals.plane,
		units: modals.units,
		distance: modals.distance,
		feedMode: modals.feedMode,
		spindle: modals.spindle ?? "M5",
		coolant: modals.coolant ?? "M9",
		tool: `T${isSet(modals.tool) ? modals.tool : 0}`,
		feedRate: `F${isSet(feedRate) ? roundModalNumber(feedRate) : 0}`,
		spindleSpeed: `S${isSet(spindleSpeed) ? roundModalNumber(spindleSpeed) : 0}`,
	};
}

type GrblModals = NonNullable<ReturnType<typeof grblModals>>;

const MODAL_LABELS: [keyof GrblModals, string][] = [
	["motion", "Motion"],
	["coordinateSystem", "WCS"],
	["plane", "Plane"],
	["units", "Units"],
	["distance", "Distance"],
	["feedMode", "Feed mode"],
	["spindle", "Spindle"],
	["coolant", "Coolant"],
	["tool", "Tool"],
	["feedRate", "Feed"],
	["spindleSpeed", "Speed"],
];

/**
 * The modal's bottom bar: work position, the G-code modal state at the current
 * line, and the processed-geometry control.
 *
 * The current line number deliberately isn't repeated here — the scrubber
 * directly above already shows it.
 */
export const StepThroughStatus: React.FC<StepThroughStatusProps> = ({
	position,
	showAAxis,
	units,
	modalState,
	previousModalState,
	hideProcessed,
	onToggleHideProcessed,
}) => {
	// Index positions are always mm; convert only for display. Both unit systems
	// use 3 decimals so the column width is constant across a units change.
	const imperial = units === IMPERIAL_UNITS;
	const linear = (mm: number) => (imperial ? mm / MM_PER_INCH : mm).toFixed(3);

	const current = grblModals(modalState);
	const previous = grblModals(previousModalState);

	return (
		<div className="flex flex-wrap items-stretch gap-2">
			<Block
				label={`Position (Work, ${imperial ? "in" : "mm"})`}
				className="flex-shrink-0"
			>
				{/* flex-1: grows to fill the card when a taller sibling (Modals)
				    stretches this Block past its own content height, so the row
				    centers vertically instead of sitting flush under the label. */}
				<div className="flex flex-1 items-center gap-x-3">
					<AxisReadout label="X" value={linear(position.x)} />
					<AxisReadout label="Y" value={linear(position.y)} />
					<AxisReadout label="Z" value={linear(position.z)} />
					{showAAxis && (
						<AxisReadout label="A" value={`${position.a.toFixed(3)}°`} />
					)}
				</div>
			</Block>

			<Block label="Modals" className="min-w-[18rem] flex-1">
				{current === null ? (
					<span className="text-xs text-gray-500 dark:text-content-muted">
						—
					</span>
				) : (
					<div className="grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-1">
						{MODAL_LABELS.map(([key, label]) => (
							<ModalCell
								key={key}
								label={label}
								value={current[key]}
								changed={previous !== null && previous[key] !== current[key]}
							/>
						))}
					</div>
				)}
			</Block>

			<button
				type="button"
				role="switch"
				aria-checked={hideProcessed}
				onClick={onToggleHideProcessed}
				className={cn(
					// w-36: fixed rather than content-sized, so the button doesn't
					// resize when "Hide prior lines" and "Show prior lines" — same
					// length but different letter widths — swap on toggle.
					"flex min-h-[2.75rem] w-36 flex-shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-xs transition-colors",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					hideProcessed
						? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
						: "border-gray-300 bg-white text-gray-600 hover:bg-gray-100 dark:border-outline dark:bg-surface-elevated dark:text-content-secondary dark:hover:bg-surface-hover",
				)}
			>
				{hideProcessed ? (
					<Eye className="h-4 w-4 flex-shrink-0" />
				) : (
					<EyeOff className="h-4 w-4 flex-shrink-0" />
				)}
				<span className="whitespace-nowrap">
					{hideProcessed ? "Show prior lines" : "Hide prior lines"}
				</span>
			</button>
		</div>
	);
};

export default StepThroughStatus;
