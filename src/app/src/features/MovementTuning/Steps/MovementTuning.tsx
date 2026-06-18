import { useValidations } from "app/features/AccessoryInstaller/hooks/UseValidations.tsx";
import type { Wizard } from "app/features/AccessoryInstaller/types";
import { Jogging } from "app/features/Jogging";
// import { useTypedSelector } from "app/hooks/useTypedSelector";
import { useContext, useMemo } from "react";
import AxisSelection from "./AxisSelection";
import Completion from "./Completion";
import DistanceTravelled from "./DistanceTravelled";
import MarkFirstLocation from "./MarkFirstLocation";
import MoveAxis from "./MoveAxis";
import { MovementTuningContext } from "../utils//MovementTuningContext";
import xAxisCalibrationImage1 from "../assets/X_axis-calibration_1.png";
import xAxisCalibrationImage2 from "../assets/X_axis-calibration_2.png";
import yAxisCalibrationImage1 from "../assets/Y_axis-calibration_1.png";
import yAxisCalibrationImage2 from "../assets/Y_axis-calibration_2.png";
import zAxisCalibrationImage1 from "../assets/Z_axis-calibration_1.png";
import zAxisCalibrationImage2 from "../assets/Z_axis-calibration_2.png";
import { SecondaryContent } from "app/components/Wizard/types";

const imageDict: Record<string, string> = {
	x1: xAxisCalibrationImage1,
	x2: xAxisCalibrationImage2,
	y1: yAxisCalibrationImage1,
	y2: yAxisCalibrationImage2,
	z1: zAxisCalibrationImage1,
	z2: zAxisCalibrationImage2,
};

export function useMovementTuningWizard(): Wizard {
	const { connectionValidation, activeStateMovementTuning } = useValidations();
	const { selectedAxis } = useContext(MovementTuningContext);

	const validations = useMemo(
		() => [connectionValidation, activeStateMovementTuning],
		[connectionValidation, activeStateMovementTuning],
	);

	const getImage = (item: SecondaryContent) => {
		return imageDict[`${selectedAxis}${item.content}`];
	}

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
								{
									type: "link",
									title: "Need help?",
									content: "Follow along in our",
									url: "https://resources.sienci.com/view/gs-calibration-tools/",
								},
							],
							function: getImage
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
							function: getImage
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
							function: getImage
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
									type: "link",
									title: "Need help?",
									content: "Follow along in our",
									url: "https://resources.sienci.com/view/atc-software/",
								},
							],
							function: getImage
						},
					],
				},
			],
		}),
		[validations],
	);
}
