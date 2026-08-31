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
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import type React from "react";

interface StepControlsProps {
	currentLine: number;
	totalLines: number;
	onStep: (delta: number) => void;
}

const STEPS = [-1000, -100, 100, 1000];

/**
 * The four coarse navigation buttons. Single-line movement is covered by
 * tapping an adjacent row in the source panel, so there are no +/-1 buttons.
 */
export const StepControls: React.FC<StepControlsProps> = ({
	currentLine,
	totalLines,
	onStep,
}) => (
	<div className="flex flex-col gap-2">
		<span className="text-xs uppercase tracking-wide text-gray-500 dark:text-content-muted">
			Step Controls
		</span>
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
