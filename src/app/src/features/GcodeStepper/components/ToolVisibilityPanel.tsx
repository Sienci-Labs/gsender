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
import { Check } from "lucide-react";
import type React from "react";
import type { StepperTool } from "../definitions";

const MM_PER_INCH = 25.4;

interface ToolVisibilityPanelProps {
	tools: StepperTool[];
	activeToolIndex: number;
	hiddenTools: ReadonlySet<number>;
	onToggleTool: (toolIndex: number) => void;
	units: string;
}

const formatDiameter = (diameterMm: number, units: string): string =>
	units === IMPERIAL_UNITS
		? `${(diameterMm / MM_PER_INCH).toFixed(4)} in`
		: `${diameterMm.toFixed(3)} mm`;

/**
 * Purpose-built toggle rather than the shared Switch: the shared one is a fixed
 * 44x24 with hard-coded thumb offsets, and this panel needs a full 44px-tall
 * hit area.
 */
const VisibilityToggle: React.FC<{
	checked: boolean;
	onToggle: () => void;
	label: string;
}> = ({ checked, onToggle, label }) => (
	<button
		type="button"
		role="switch"
		aria-checked={checked}
		aria-label={label}
		onClick={onToggle}
		className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
	>
		<span
			className={cn(
				"relative flex h-7 w-12 items-center rounded-full border transition-colors",
				checked
					? "border-robin-500 bg-robin-500 dark:border-robin-400 dark:bg-robin-400"
					: "border-gray-400 bg-gray-300 dark:border-outline dark:bg-surface-hover",
			)}
		>
			<span
				className={cn(
					"absolute h-5 w-5 rounded-full bg-white shadow transition-transform dark:bg-gray-200",
					checked ? "translate-x-6" : "translate-x-1",
				)}
			/>
		</span>
	</button>
);

const ToolVisibilityItem: React.FC<{
	tool: StepperTool;
	isActive: boolean;
	isVisible: boolean;
	onToggle: () => void;
	units: string;
}> = ({ tool, isActive, isVisible, onToggle, units }) => (
	<div
		className={cn(
			"flex flex-col gap-1 rounded-lg border p-3",
			isActive
				? "border-2 border-green-500 bg-green-50 dark:bg-surface-elevated"
				: "border-gray-200 bg-white dark:border-outline dark:bg-surface-sunken",
		)}
	>
		<div className="flex items-center gap-2">
			<span
				aria-hidden="true"
				className="h-3 w-3 shrink-0 rounded-full border border-black/20"
				style={{ backgroundColor: tool.color }}
			/>
			<span className="font-medium text-gray-900 dark:text-content-primary">
				Tool {tool.toolNumber}
			</span>

			{isActive && (
				<span className="flex items-center gap-1 rounded bg-green-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
					<Check className="h-3 w-3" />
					Active
				</span>
			)}

			<div className="ml-auto">
				<VisibilityToggle
					checked={isVisible}
					onToggle={onToggle}
					label={`Toggle visibility of tool ${tool.toolNumber}`}
				/>
			</div>
		</div>

		{tool.comment && (
			<span className="truncate text-xs text-gray-500 dark:text-content-muted">
				{tool.comment}
			</span>
		)}

		{/* Metadata rows are omitted entirely when the file doesn't provide them. */}
		{tool.diameter !== undefined && (
			<span className="text-xs text-gray-600 dark:text-content-secondary">
				&#8960; {formatDiameter(tool.diameter, units)}
			</span>
		)}
		{tool.spindleSpeed !== undefined && (
			<span className="text-xs text-gray-600 dark:text-content-secondary">
				Spindle: {tool.spindleSpeed.toLocaleString()} RPM
			</span>
		)}
		<span className="text-[10px] text-gray-400 dark:text-content-muted">
			Lines {tool.startLine.toLocaleString()}–{tool.endLine.toLocaleString()}
		</span>
	</div>
);

/**
 * Tools used by the loaded file, with the one active at the current line
 * highlighted.
 *
 * The visibility switches currently only drive local state: gviewer has no API
 * for hiding an individual tool's paths (only whole-stream and line-range
 * operations), so there is nothing to call through to yet. Once the package
 * exposes per-tool stream visibility, `onToggleTool` is the single place the
 * viewer call needs to be added.
 */
export const ToolVisibilityPanel: React.FC<ToolVisibilityPanelProps> = ({
	tools,
	activeToolIndex,
	hiddenTools,
	onToggleTool,
	units,
}) => (
	<div className="flex h-full min-h-0 flex-col gap-2">
		<span className="text-xs uppercase tracking-wide text-gray-500 dark:text-content-muted">
			Tools
		</span>

		{tools.length === 0 ? (
			<span className="text-xs text-gray-500 dark:text-content-muted">
				No tools found in this file.
			</span>
		) : (
			<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
				{tools.map((tool, i) => (
					<ToolVisibilityItem
						key={`${tool.toolNumber}-${tool.startLine}`}
						tool={tool}
						isActive={i === activeToolIndex}
						isVisible={!hiddenTools.has(i)}
						onToggle={() => onToggleTool(i)}
						units={units}
					/>
				))}
			</div>
		)}
	</div>
);

export default ToolVisibilityPanel;
