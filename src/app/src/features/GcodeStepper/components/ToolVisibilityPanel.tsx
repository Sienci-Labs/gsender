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
import { Eye, EyeOff, Wrench } from "lucide-react";
import type React from "react";
import type { StepperTool } from "../definitions";
import { readableTextColor } from "../utils/tools";

const MM_PER_INCH = 25.4;

interface ToolVisibilityPanelProps {
	tools: StepperTool[];
	activeToolIndex: number;
	hiddenTools: ReadonlySet<number>;
	onToggleTool: (toolIndex: number) => void;
	/** Jump the whole modal to a line — used when a card is clicked. */
	onSelectLine: (line: number) => void;
	units: string;
}

const formatDiameter = (diameterMm: number, units: string): string =>
	units === IMPERIAL_UNITS
		? `${(diameterMm / MM_PER_INCH).toFixed(4)} in`
		: `${diameterMm.toFixed(3)} mm`;

/**
 * Visibility control for one tool's paths.
 *
 * Filled with the tool's own colour when visible so it reads as belonging to
 * that toolpath, and a neutral outline when hidden. Geometry matches the remap
 * button in ToolTimelineItem (44px wide, full card height) so the two panels
 * line up and the touch target is comfortable.
 */
const VisibilityButton: React.FC<{
	tool: StepperTool;
	isVisible: boolean;
	onToggle: () => void;
}> = ({ tool, isVisible, onToggle }) => (
	<button
		type="button"
		role="switch"
		aria-checked={isVisible}
		aria-label={`${isVisible ? "Hide" : "Show"} tool ${tool.toolNumber} toolpath`}
		onClick={(e) => {
			// The card itself navigates; toggling visibility must not also jump.
			e.stopPropagation();
			onToggle();
		}}
		style={
			isVisible
				? {
						backgroundColor: tool.color,
						// Half the palette is light enough that white would wash out.
						color: readableTextColor(tool.color),
						borderColor: tool.color,
					}
				: undefined
		}
		className={cn(
			"relative z-10 flex w-11 flex-shrink-0 items-center justify-center self-stretch rounded-lg border transition-colors",
			"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
			!isVisible &&
				"border-gray-300/80 bg-gray-100 text-gray-500 hover:bg-gray-200 dark:border-outline/70 dark:bg-surface-elevated dark:text-content-muted dark:hover:bg-surface-hover",
		)}
	>
		{isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
	</button>
);

/**
 * One tool card, built on ToolTimelineItem's shell so the step-through panel and
 * the ATC timeline read as the same component family.
 */
const ToolVisibilityItem: React.FC<{
	tool: StepperTool;
	isActive: boolean;
	isVisible: boolean;
	isLast: boolean;
	onToggle: () => void;
	onSelect: () => void;
	units: string;
}> = ({ tool, isActive, isVisible, isLast, onToggle, onSelect, units }) => (
	<div className="flex flex-col items-center">
		{/* A plain div rather than a button: the visibility control is itself a
		    button, and buttons can't nest. role + tabIndex + key handling give it
		    the same semantics. */}
		<div
			role="button"
			tabIndex={0}
			aria-label={`Go to tool ${tool.toolNumber}, line ${tool.startLine}`}
			onClick={onSelect}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect();
				}
			}}
			className={cn(
				"group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-lg border border-l-0 px-3 py-3 text-left transition-colors",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				isActive
					? "border-2 bg-gray-50/80 dark:bg-surface-raised/80"
					: "border-gray-200 bg-gray-50/80 hover:bg-gray-100/80 dark:border-outline dark:bg-surface-raised/80 dark:hover:bg-surface-hover/80",
				// A hidden tool is dimmed so the panel can be scanned without
				// reading every button.
				!isVisible && "opacity-50",
			)}
			style={{
				borderColor: isActive ? tool.color : undefined,
				boxShadow: isActive ? `0 0 18px 2px ${tool.color}44` : undefined,
			}}
		>
			<div
				className={cn(
					"absolute left-0 top-0 h-full w-[3px] rounded-l-lg",
					!isVisible && "opacity-40",
				)}
				style={{ backgroundColor: tool.color }}
			/>
			{isActive && (
				<div
					className="pointer-events-none absolute inset-0 opacity-10"
					style={{
						backgroundImage: `repeating-linear-gradient(135deg, ${tool.color}, ${tool.color} 6px, transparent 6px, transparent 14px)`,
					}}
				/>
			)}

			<div
				className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold"
				style={{
					backgroundColor: tool.color,
					color: readableTextColor(tool.color),
				}}
			>
				{tool.index}
			</div>

			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex min-h-[1.25rem] items-center gap-1.5">
					<span className="font-mono text-sm font-semibold text-gray-900 dark:text-content-primary">
						T{tool.toolNumber}
					</span>
					{tool.comment && (
						<>
							<span className="text-gray-500 dark:text-content-muted">·</span>
							<span className="truncate text-xs text-gray-500 dark:text-content-muted">
								{tool.comment}
							</span>
						</>
					)}
				</div>

				{/* Metadata rows are omitted entirely when the file doesn't provide them. */}
				{(tool.diameter !== undefined || tool.spindleSpeed !== undefined) && (
					<div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-600 dark:text-content-secondary">
						{tool.diameter !== undefined && (
							<span>&#8960; {formatDiameter(tool.diameter, units)}</span>
						)}
						{tool.spindleSpeed !== undefined && (
							<span>{tool.spindleSpeed.toLocaleString()} RPM</span>
						)}
					</div>
				)}
			</div>

			<div className="flex flex-shrink-0 items-center gap-3 self-stretch">
				<span className="whitespace-nowrap font-mono text-xs text-gray-500 dark:text-content-muted">
					{tool.startLine}-{tool.endLine}
				</span>
				<VisibilityButton
					tool={tool}
					isVisible={isVisible}
					onToggle={onToggle}
				/>
			</div>
		</div>

		{!isLast && (
			<div className="h-4 w-px bg-gray-300/50 dark:bg-outline-subtle/50" />
		)}
	</div>
);

/**
 * Tools used by the loaded file, with the one active at the current line
 * highlighted.
 *
 * The visibility buttons report through `onToggleTool`; the modal owns the
 * hidden set and hands it to the visualizer, which loads the toolpath split by
 * tool so each one can be hidden on its own.
 */
export const ToolVisibilityPanel: React.FC<ToolVisibilityPanelProps> = ({
	tools,
	activeToolIndex,
	hiddenTools,
	onToggleTool,
	onSelectLine,
	units,
}) => (
	<div className="flex h-full min-h-0 flex-col gap-2">
		<span className="text-xs uppercase tracking-wide text-gray-500 dark:text-content-muted">
			Tools
		</span>

		{tools.length === 0 ? (
			<div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-500 dark:text-content-muted">
				<Wrench className="h-12 w-12" />
				<span className="text-xs">No tools found in this file.</span>
			</div>
		) : (
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
				{tools.map((tool, i) => (
					<ToolVisibilityItem
						key={`${tool.toolNumber}-${tool.startLine}`}
						tool={tool}
						isActive={i === activeToolIndex}
						isVisible={!hiddenTools.has(i)}
						isLast={i === tools.length - 1}
						onToggle={() => onToggleTool(i)}
						onSelect={() => onSelectLine(tool.startLine)}
						units={units}
					/>
				))}
			</div>
		)}
	</div>
);

export default ToolVisibilityPanel;
