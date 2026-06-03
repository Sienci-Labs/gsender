import { LongPressButton } from "app/components/LongPressButton";
import { ToolDisplayModal } from "app/features/ATC/components/ToolDisplayModal.tsx";
import {
	releaseToolFromSpindle,
	unloadTool,
} from "app/features/ATC/utils/ATCFunctions.ts";
import { useToolChange } from "app/features/ATC/utils/ToolChangeContext.tsx";
import { Download, Upload } from "lucide-react";

export function AdvancedOptions() {
	const { disabled, setLoadToolMode, setLoadToolOpen } = useToolChange();

	const handleManualLoad = () => {
		setLoadToolMode("manual");
		setLoadToolOpen(true);
	};

	const handleLoad = () => {
		setLoadToolMode("load");
		setLoadToolOpen(true);
	};

	return (
		<div className="flex h-full w-full flex-col gap-4">
			<div className="flex items-center justify-end gap-2">
				<ToolDisplayModal />
			</div>

			<div className="flex flex-col gap-2 border-t border-gray-200 pt-3">
				<LongPressButton
					disabled={disabled}
					label="Load"
					icon={<Download className="h-5 w-5" />}
					onClick={handleLoad}
					onLongPress={handleManualLoad}
				/>
				<LongPressButton
					disabled={disabled}
					label="Unload"
					icon={<Upload className="h-5 w-5" />}
					onClick={unloadTool}
					onLongPress={releaseToolFromSpindle}
				/>
			</div>
		</div>
	);
}
