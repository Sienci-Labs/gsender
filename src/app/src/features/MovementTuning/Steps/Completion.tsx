import Button from "app/components/Button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "app/components/shadcn/AlertDialog";
import type { EEPROM } from "app/definitions/firmware";
import { useTypedSelector } from "app/hooks/useTypedSelector";
import { useWorkspaceState } from "app/hooks/useWorkspaceState";
import controller from "app/lib/controller";
import { toFixedIfNecessary } from "app/lib/rounding";
import { useContext } from "react";
import { toast } from "sonner";
import { calculateNewStepsPerMM, getEEPROMSettingKey } from "../utils";
import { MovementTuningContext } from "../utils/MovementTuningContext";

const Completion = () => {
	const { moveDistance, measuredDistance, selectedAxis } = useContext(
		MovementTuningContext,
	);
	const { units } = useWorkspaceState();
	const { settings } = useTypedSelector((state) => state.controller.settings);

	const handleUpdateEEPROM = () => {
		const currentStepsPerMM = Number(settings[eepromKey as EEPROM]);

		const newStepsPerMM = calculateNewStepsPerMM({
			originalStepsPerMM: currentStepsPerMM,
			givenDistanceMoved: moveDistance,
			actualDistanceMoved: measuredDistance,
		});

		controller.command("gcode", [`${eepromKey}=${newStepsPerMM}`, "$$"]);

		toast.info("Updated steps-per-mm value", { position: "bottom-right" });
	};

	const eepromKey = getEEPROMSettingKey(selectedAxis);
	const currentStepsPerMM = Number(settings[eepromKey as EEPROM]);

	if (moveDistance !== measuredDistance) {
		return (
			<div className="flex flex-col gap-4">
				<div className="text-yellow-800 bg-yellow-100 p-4 rounded-lg border min-h-52 flex flex-col gap-4 justify-center items-center text-lg dark:bg-yellow-950 dark:text-white dark:border-yellow-950">
					<span>
						Your {selectedAxis.toUpperCase()}-axis movement was off by{" "}
						<strong>
							{toFixedIfNecessary(moveDistance - measuredDistance, 4)} {units}.
						</strong>{" "}
						Consider updating your {selectedAxis.toUpperCase()}
						-axis step/mm value in your CNC firmware.
					</span>

					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button className="bg-white text-black" variant="outline">
								Update step/mm
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent className="bg-white">
							<AlertDialogHeader>
								<AlertDialogTitle>Update Firmware</AlertDialogTitle>
								<div className="space-y-4">
									<p>
										This will update the{" "}
										<strong>
											{selectedAxis.toUpperCase()}
											-axis
										</strong>{" "}
										step/mm value in your CNC firmware ({" "}
										<strong>{getEEPROMSettingKey(selectedAxis)}</strong> )
									</p>
									<p>
										From: <strong>{currentStepsPerMM}</strong>
									</p>
									<p>
										To:{" "}
										<strong>
											{calculateNewStepsPerMM({
												originalStepsPerMM: currentStepsPerMM,
												givenDistanceMoved: moveDistance,
												actualDistanceMoved: measuredDistance,
											})}
										</strong>
									</p>
								</div>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									className="border border-blue-500"
									onClick={handleUpdateEEPROM}
								>
									Update Firmware
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="text-green-800 bg-green-100 p-4 rounded-lg border min-h-52 flex flex-col gap-4 justify-center items-center text-lg dark:bg-green-950 dark:text-white dark:border-green-950">
				<p>
					Your {selectedAxis.toUpperCase()}-axis looks accurate, so you should
					be good to go!
				</p>
			</div>
		</div>
	);
};

export default Completion;
