import { StepActionButton } from "app/components/Wizard/StepActionButton.tsx";
import type { StepProps } from "app/components/Wizard/types";
import controller from "app/lib/controller";
import { useState } from "react";

export function ZeroPosition({ onComplete }: StepProps) {
	const [isComplete, setIsComplete] = useState(false);

	const handleZero = () => {
		controller.command("gcode", "G10 L20 P0 X0 Y0");
		setIsComplete(true);
		onComplete();
	};

	return (
		<div className="flex flex-col gap-5 justify-start">
			<p className="dark:text-content-primary">
				Jog to the front-left corner of your vacuum table.
			</p>
			<p className="dark:text-content-primary">
				Once you're in position, zero the X and Y axes so the mounting and grid
				files line up with the table.
			</p>
			<StepActionButton
				label="Zero X/Y"
				runningLabel="Zeroing..."
				onApply={handleZero}
				isComplete={isComplete}
			/>
		</div>
	);
}
