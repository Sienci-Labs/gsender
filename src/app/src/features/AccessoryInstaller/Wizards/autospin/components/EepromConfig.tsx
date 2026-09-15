import { StepActionButton } from "app/components/Wizard/StepActionButton.tsx";
import { Confirm } from "app/components/ConfirmationDialog/ConfirmationDialogLib.ts";
import { GRBLHAL } from "app/constants";
import { useTypedSelector } from "app/hooks/useTypedSelector.ts";
import controller from "app/lib/controller.ts";
import type { RootState } from "app/store/redux";
import delay from "lodash/delay";
import { useState } from "react";

export const grblHalAutoSpinGcode = [
	"$9 = 1",
	"G4P0.1",
	"$16 = 0",
	"G4P0.1",
	"$30 = 30000",
	"G4P0.1",
	"$31 = 10000",
	"G4P0.1",
	"$33 = 1000",
	"G4P0.1",
	"$34 = 0",
	"G4P0.1",
	"$35 = 30",
	"G4P0.1",
	"$36 = 90",
	"G4P0.1",
	"$395 = 0",
	"G4P0.1",
	";Flash onboard LED to confirm",
	"M356 P0 Q2",
	"M356 P1 Q2",
	"G4P0.1",
	"M356 P0 Q1",
	"M356 P1 Q1",
	"M356 P0 Q2",
	"M356 P1 Q2",
	"G4P0.1",
	"M356 P0 Q1",
	"M356 P1 Q1",
	"M356 P0 Q0",
	"M356 P1 Q0",
	"(End of Macro 1)",
	"(Reset)",
	"M2",
	"G4P0.1",
	"$$",
];

export const genericAutoSpinGcode = [
	"G4P0.1",
	"$31=1",
	"G4P0.1",
	"$30=31250",
	"G4P0.1",
	"$$",
];

interface Props {
	onComplete: () => void;
}

export function EepromConfig({ onComplete }: Props) {
	const [hasApplied, setHasApplied] = useState<boolean>(false);

	const isConnected = useTypedSelector(
		(state: RootState) => state.connection.isConnected,
	);
	const firmwareType = useTypedSelector(
		(state: RootState) => state.controller.type,
	);

	function applyAutoSpinSettings() {
		const gcode =
			firmwareType === GRBLHAL ? grblHalAutoSpinGcode : genericAutoSpinGcode;

		controller.command("gcode", gcode);

		delay(() => {
			Confirm({
				title: "Restart your Controller",
				content:
					"Please manually restart your CNC controller (power cycle) and reconnect to gSender for these settings to take effect.",
				confirmLabel: "OK",
				hideClose: true,
			});
			setHasApplied(true);
			onComplete();
		}, 500);
	}

	return (
		<div className="flex flex-col gap-5 justify-start">
			<p className="dark:text-content-primary">
				Your AutoSpin EEPROM settings are applied in this step based on your
				connected firmware type.
			</p>
			<ol className="list-decimal p-5 gap-4 space-y-2 text-gray-900 dark:text-content-primary">
				<li>
					Press <b>"Apply Settings"</b>
				</li>
				<li>Reboot your controller using the power switch and reconnect</li>
				<li>
					Click <b>"Next"</b>
				</li>
			</ol>
			<StepActionButton
				label="Apply Settings"
				runningLabel="Configuring..."
				onApply={applyAutoSpinSettings}
				isComplete={hasApplied}
				disabled={!isConnected}
				data-testid="autospin-apply-settings"
			/>
		</div>
	);
}
