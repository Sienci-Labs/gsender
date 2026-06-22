/*
 * Copyright (C) 2022 Sienci Labs Inc.
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

import ReactDOM from "react-dom";
import { useState, useEffect } from "react";
import Instructions from "app/features/Helper/components/Instructions";
import Stepper from "app/features/Helper/components/Stepper";
import Controls from "app/features/Helper/components/Controls";
import { useWizardContext } from "app/features/Helper/context";
import MinMaxButton from "app/features/Helper/components/MinMaxButton";
import CancelButton from "app/features/Helper/components/CancelButton";
import { Wrench } from "lucide-react";
import store from "app/store";
import controller from "app/lib/controller.ts";

// Fetch toolchange settings and send it to backend
export function updateToolchangeContext(mappings = null) {
	const hooks = store.get("workspace.toolChangeHooks", {});
	const options = store.get("workspace.toolChange", {});
	const toolChangeOption = store.get("workspace.toolChangeOption", "Ignore");
	const context = {
		...hooks,
		toolChangeOption,
		...options,
	};

	if (mappings) {
		const plainObject = Array.from(mappings).reduce(
			(obj, [key, value]) => {
				obj[key] = value;
				return obj;
			},
			{} as Record<number, number>,
		);

		context.mappings = plainObject;
	}

	controller.command("toolchange:context", context);
}

const Wizard = () => {
	const { title, visible, minimized, overlay } = useWizardContext();
	const [vizEl, setVizEl] = useState<Element | null>(null);

	useEffect(() => {
		setVizEl(document.getElementById("visualizer_container"));
	}, []);

	if (!visible) return null;

	// Minimized: compact pill at top-center of visualizer
	if (minimized) {
		const pill = (
			<div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-[#18181f]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2a2a35] shadow-md">
				<Wrench
					size={12}
					className="text-gray-500 dark:text-gray-400 shrink-0"
				/>
				<span className="font-medium text-gray-700 dark:text-[#e5e5ea] text-xs whitespace-nowrap">
					{title}
				</span>
				<MinMaxButton />
				<CancelButton />
			</div>
		);

		if (vizEl) {
			return ReactDOM.createPortal(pill, vizEl);
		}
		// Fallback: fixed at top of visualizer area
		return (
			<div className="fixed top-14 max-xl:top-12 left-0 right-[33%] flex justify-center z-[200] pointer-events-none">
				{pill}
			</div>
		);
	}

	return (
		<>
			{/* Backdrop — only when substep.overlay is true (blocks UI interaction) */}
			{overlay && (
				<div className="fixed inset-0 bg-black/55 z-[199] pointer-events-auto" />
			)}

			<div className="fixed inset-y-0 left-0 right-[33%] flex items-center justify-center z-[200] pointer-events-none">
				<div className="pointer-events-auto w-[860px] rounded-lg overflow-hidden shadow-2xl border border-gray-300/50 dark:border-[#2a2a35] bg-white dark:bg-[#18181f]">
					{/* Titlebar */}
					<div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-[#2a2a35] bg-gray-100 dark:bg-[#111116]">
						<div className="flex items-center gap-2">
							<Wrench size={14} className="text-gray-500 dark:text-gray-400" />
							<span className="font-semibold text-base text-gray-900 dark:text-[#e5e5ea]">
								{title}
							</span>
						</div>
						<div className="flex gap-1">
							<MinMaxButton />
							<CancelButton />
						</div>
					</div>

					{/* Body */}
					<div className="flex h-[420px]">
						<Stepper />
						<Instructions />
					</div>

					{/* Footer */}
					<Controls />
				</div>
			</div>
		</>
	);
};

export default Wizard;
