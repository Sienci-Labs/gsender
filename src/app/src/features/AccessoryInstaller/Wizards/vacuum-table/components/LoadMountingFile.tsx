import { StepActionButton } from "app/components/Wizard/StepActionButton.tsx";
import type { StepProps } from "app/components/Wizard/types";
import { DEFAULT_VACUUM_TABLE_SIZE } from "app/features/AccessoryInstaller/Wizards/vacuum-table/constants/sizes.ts";
import { useVacuumTable } from "app/features/AccessoryInstaller/Wizards/vacuum-table/context/VacuumTableContext.tsx";
import { loadBundledGcodeToVisualizer } from "app/features/AccessoryInstaller/Wizards/vacuum-table/utils/loadGcodeAsset.ts";
import { MOUNTING_GCODE_BY_SIZE } from "app/features/AccessoryInstaller/Wizards/vacuum-table/utils/mountingGcodeBySize.ts";
import { useState } from "react";
import { useNavigate } from "react-router";

export function LoadMountingFile({ onComplete }: StepProps) {
	const navigate = useNavigate();
	const [isComplete, setIsComplete] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { tableSize } = useVacuumTable();

	const asset =
		MOUNTING_GCODE_BY_SIZE[tableSize] ??
		MOUNTING_GCODE_BY_SIZE[DEFAULT_VACUUM_TABLE_SIZE];

	const handleLoad = async () => {
		try {
			await loadBundledGcodeToVisualizer(asset.url, asset.name);
			setError(null);
			setIsComplete(true);
			onComplete();
			navigate("/");
		} catch {
			setError("Unable to load the mounting file. Please try again.");
		}
	};

	return (
		<div className="flex flex-col gap-5 justify-start">
			<p className="dark:text-content-primary">
				Load the mounting-hole pattern for your vacuum table. This will open the
				file in the main visualizer.
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
