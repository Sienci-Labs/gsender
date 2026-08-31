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
import type React from "react";
import type { StepPosition } from "../definitions";

const MM_PER_INCH = 25.4;

interface StepThroughStatusProps {
	currentLine: number;
	totalLines: number;
	position: StepPosition;
	/** A is only shown when the loaded file actually contains rotary movement. */
	showAAxis: boolean;
	units: string;
}

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

export const StepThroughStatus: React.FC<StepThroughStatusProps> = ({
	currentLine,
	totalLines,
	position,
	showAAxis,
	units,
}) => {
	// Index positions are always mm; convert only for display.
	const imperial = units === IMPERIAL_UNITS;
	const linear = (mm: number) =>
		imperial ? (mm / MM_PER_INCH).toFixed(4) : mm.toFixed(3);

	return (
		<div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-outline dark:bg-surface-sunken">
			<div className="flex items-baseline gap-1">
				<span className="text-xs text-gray-500 dark:text-content-muted">
					Current line
				</span>
				<span className="font-mono tabular-nums text-gray-900 dark:text-content-primary">
					{currentLine.toLocaleString()} / {totalLines.toLocaleString()}
				</span>
			</div>

			<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
				<span className="text-xs text-gray-500 dark:text-content-muted">
					Position (Work, {imperial ? "in" : "mm"})
				</span>
				<AxisReadout label="X" value={linear(position.x)} />
				<AxisReadout label="Y" value={linear(position.y)} />
				<AxisReadout label="Z" value={linear(position.z)} />
				{showAAxis && (
					<AxisReadout label="A" value={`${position.a.toFixed(3)}°`} />
				)}
			</div>
		</div>
	);
};

export default StepThroughStatus;
