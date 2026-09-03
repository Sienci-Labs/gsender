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
import {
	ChevronsLeft,
	ChevronsRight,
	Pause,
	Play,
	RotateCcw,
} from "lucide-react";
import type React from "react";

interface StepControlsProps {
	currentLine: number;
	totalLines: number;
	onStep: (delta: number) => void;
	isPlaying: boolean;
	speed: number;
	onSpeedChange: (speed: number) => void;
	onTogglePlay: () => void;
	onReset: () => void;
}

const STEPS = [-1000, -100, 100, 1000];
const SPEEDS = [0.5, 1, 10, 100];

/**
 * The step navigation controls: coarse ±100/±1000 jump buttons (single-line
 * movement is covered by tapping an adjacent row in the source panel, so
 * there are no +/-1 buttons here), plus play/pause/reset and a speed
 * multiplier for watching the file step through on its own.
 */
export const StepControls: React.FC<StepControlsProps> = ({
	currentLine,
	totalLines,
	onStep,
	isPlaying,
	speed,
	onSpeedChange,
	onTogglePlay,
	onReset,
}) => (
	<div className="flex flex-col gap-2">
		<span className="text-xs uppercase tracking-wide text-gray-500 dark:text-content-muted">
			Step Controls
		</span>

		<div className="flex flex-wrap items-center gap-2">
			<button
				type="button"
				disabled={totalLines === 0}
				onClick={onTogglePlay}
				aria-label={isPlaying ? "Pause playback" : "Play"}
				className={cn(
					"flex min-h-[3.25rem] w-16 flex-shrink-0 items-center justify-center rounded-lg border transition-colors",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					"disabled:cursor-not-allowed disabled:opacity-40",
					isPlaying
						? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
						: "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-outline dark:bg-surface-elevated dark:text-content-primary dark:hover:bg-surface-hover",
				)}
			>
				{isPlaying ? (
					<Pause className="h-5 w-5" />
				) : (
					<Play className="h-5 w-5" />
				)}
			</button>

			<button
				type="button"
				disabled={totalLines === 0 || currentLine === 1}
				onClick={onReset}
				aria-label="Reset to start"
				className={cn(
					"flex min-h-[3.25rem] w-16 flex-shrink-0 items-center justify-center rounded-lg border transition-colors",
					"border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-outline dark:bg-surface-elevated dark:text-content-primary dark:hover:bg-surface-hover",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					"disabled:cursor-not-allowed disabled:opacity-40",
				)}
			>
				<RotateCcw className="h-5 w-5" />
			</button>

			<div className="flex min-h-[3.25rem] flex-1 items-center gap-1 rounded-lg border border-gray-200 p-1 dark:border-outline">
				{SPEEDS.map((preset) => (
					<button
						key={preset}
						type="button"
						onClick={() => onSpeedChange(preset)}
						aria-pressed={speed === preset}
						className={cn(
							"flex-1 rounded-md py-2 text-xs font-medium transition-colors",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							speed === preset
								? "bg-blue-500 text-white"
								: "text-gray-600 hover:bg-gray-100 dark:text-content-secondary dark:hover:bg-surface-hover",
						)}
					>
						{preset}x
					</button>
				))}
			</div>
		</div>

		<div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
			{STEPS.map((delta) => {
				const back = delta < 0;
				const disabled = back ? currentLine <= 1 : currentLine >= totalLines;
				const Icon = back ? ChevronsLeft : ChevronsRight;

				return (
					<button
						key={delta}
						type="button"
						disabled={disabled}
						onClick={() => onStep(delta)}
						aria-label={`${back ? "Back" : "Forward"} ${Math.abs(delta)} lines`}
						className={cn(
							"flex min-h-[3.25rem] items-center justify-center gap-2 rounded-lg border px-3 text-base font-medium",
							"border-gray-300 bg-white text-gray-700",
							"dark:border-outline dark:bg-surface-elevated dark:text-content-primary",
							"hover:bg-gray-100 dark:hover:bg-surface-hover active:scale-[0.99]",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							"disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-surface-elevated",
						)}
					>
						{back && <Icon className="h-5 w-5 shrink-0" />}
						<span className="whitespace-nowrap">
							{back ? "-" : "+"}
							{Math.abs(delta)} lines
						</span>
						{!back && <Icon className="h-5 w-5 shrink-0" />}
					</button>
				);
			})}
		</div>
	</div>
);

export default StepControls;
