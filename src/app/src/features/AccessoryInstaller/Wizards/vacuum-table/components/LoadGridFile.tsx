import { StepActionButton } from "app/components/Wizard/StepActionButton.tsx";
import type { StepProps } from "app/components/Wizard/types";
import gridGcodeUrl from "app/features/AccessoryInstaller/Wizards/vacuum-table/assets/gcode/Grids.gcode?url";
import { loadBundledGcodeToVisualizer } from "app/features/AccessoryInstaller/Wizards/vacuum-table/utils/loadGcodeAsset.ts";
import { useState } from "react";
import { useNavigate } from "react-router";

export function LoadGridFile({ onComplete }: StepProps) {
	const navigate = useNavigate();
	const [isComplete, setIsComplete] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleLoad = async () => {
		try {
			await loadBundledGcodeToVisualizer(
				gridGcodeUrl,
				"gSender_Vacuum_Table_Grid",
			);
			setError(null);
			setIsComplete(true);
			onComplete();
			navigate("/");
		} catch {
			setError("Unable to load the grid file. Please try again.");
		}
	};

	return (
		<div className="flex flex-col gap-5 justify-start">
			<p className="dark:text-content-primary">
				Load the alignment grid pattern for your vacuum table. This will open
				the file in the main visualizer.
			</p>
			<StepActionButton
				label="Load to Visualizer"
				runningLabel="Loading..."
				onApply={handleLoad}
				isComplete={isComplete}
				error={error}
			/>
		</div>
	);
}
