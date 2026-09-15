import { GRBLHAL } from "app/constants";
import { useTypedSelector } from "app/hooks/useTypedSelector.ts";
import type { RootState } from "app/store/redux";
import {
	genericAutoSpinGcode,
	grblHalAutoSpinGcode,
} from "./EepromConfig.tsx";

export function AutoSpinGcodePreview() {
	const firmwareType = useTypedSelector(
		(state: RootState) => state.controller.type,
	);
	const isGrblHal = firmwareType === GRBLHAL;
	const lines = isGrblHal ? grblHalAutoSpinGcode : genericAutoSpinGcode;
	const label = isGrblHal ? "grblHAL" : "Other Firmware";

	return (
		<div className="w-full h-full flex flex-col gap-3 min-h-0">
			<div className="flex items-center gap-2 flex-shrink-0">
				<span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
					{label}
				</span>
			</div>
			<div className="flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-md bg-white dark:bg-surface-raised">
				<div className="font-mono text-sm">
					{lines.map((line, index) => (
						<div
							key={index}
							className={`py-1 px-2 text-gray-900 dark:text-content-primary ${
								index % 2 === 0 ? "bg-gray-100 dark:bg-surface-elevated" : ""
							}`}
						>
							<span className="text-gray-500 dark:text-content-muted mr-4">
								{index + 1}
							</span>
							{line}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
