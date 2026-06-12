import { useValidations } from "app/features/AccessoryInstaller/hooks/UseValidations.tsx";
import type { Wizard } from "app/features/AccessoryInstaller/types";
import { Jogging } from "app/features/Jogging";
// import { useTypedSelector } from "app/hooks/useTypedSelector";
import { useMemo } from "react";
import xAxisCalibrationImage1 from "../assets/X_axis-calibration_1.png";
import AxisSelection from "./AxisSelection";
import Completion from "./Completion";
import DistanceTravelled from "./DistanceTravelled";
import MarkFirstLocation from "./MarkFirstLocation";
import MoveAxis from "./MoveAxis";

export function useMovementTuningWizard(): Wizard {
	const { connectionValidation, activeStateMovementTuning } = useValidations();

	const validations = useMemo(
		() => [connectionValidation, activeStateMovementTuning],
		[connectionValidation, activeStateMovementTuning],
	);

	// const isConnected = useTypedSelector((state) => state.connection.isConnected);

	return useMemo<Wizard>(
		() => ({
			id: "movement-tuning",
			title: "Movement Tuning",
			image: xAxisCalibrationImage1,
			validations: [...validations],
			helpUrl: "https://resources.sienci.com/view/gs-calibration-tools/",
			subWizards: [
				{
					id: "initial-setup",
					title: "Movement Tuning",
					description: "Configure your axes to account for small inaccuracies",
					estimatedTime: "5 - 10 minutes",
					completionPage: Completion,
					steps: [
						{
							id: "landing",
							title: "Axis Selection",
							component: AxisSelection,
							secondaryContent: [
								{
									type: "image",
									content: "1",
								},
								{
									type: "component",
									content: Jogging,
									props: {
										hideRotary: true,
									},
								},
							],
						},
						{
							id: "first-location",
							title: "Mark First Location",
							component: MarkFirstLocation,
							secondaryContent: [
								{
									type: "image",
									content: "1",
								},
								{
									type: "link",
									title: "Need help?",
									content: "Follow along in our",
									url: "https://resources.sienci.com/view/gs-calibration-tools/",
								},
							],
						},
						{
							id: "move-axis",
							title: "Move X-Axis",
							component: MoveAxis,
							secondaryContent: [
								{
									type: "image",
									content: "2",
								},
								{
									type: "link",
									title: "Need help?",
									content: "Follow along in our",
									url: "https://resources.sienci.com/view/gs-calibration-tools/",
								},
							],
						},
						{
							id: "distance-travelled",
							title: "Set Distance Travelled",
							component: DistanceTravelled,
							secondaryContent: [
								{
									type: "image",
									content: "2",
								},
								{
									type: "component",
									content: Jogging,
									props: {
										hideRotary: true,
									},
								},
								{
									type: "link",
									title: "Need help?",
									content: "Follow along in our",
									url: "https://resources.sienci.com/view/atc-software/",
								},
							],
						},
					],
				},
			],
		}),
		[validations],
	);
}
