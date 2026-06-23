/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import { useValidations } from "app/components/Wizard/hooks/UseValidations.tsx";
import type { SecondaryContent, Wizard } from "app/components/Wizard/types";
import { Jogging } from "app/features/Jogging";
import { useMemo } from "react";
import xAxisCalibrationImage1 from "../assets/X_axis-calibration_1.png";
import xAxisCalibrationImage2 from "../assets/X_axis-calibration_2.png";
import yAxisCalibrationImage1 from "../assets/Y_axis-calibration_1.png";
import yAxisCalibrationImage2 from "../assets/Y_axis-calibration_2.png";
import zAxisCalibrationImage1 from "../assets/Z_axis-calibration_1.png";
import zAxisCalibrationImage2 from "../assets/Z_axis-calibration_2.png";
import { useMovementTuning } from "../utils/MovementTuningContext";
import AxisSelection from "./AxisSelection";
import Completion from "./Completion";
import DistanceTravelled from "./DistanceTravelled";
import MarkFirstLocation from "./MarkFirstLocation";
import MoveAxis from "./MoveAxis";

const imageDict: Record<string, string> = {
	x1: xAxisCalibrationImage1,
	x2: xAxisCalibrationImage2,
	y1: yAxisCalibrationImage1,
	y2: yAxisCalibrationImage2,
	z1: zAxisCalibrationImage1,
	z2: zAxisCalibrationImage2,
};

export function useMovementTuningWizard(): Wizard {
	const { connectionValidation, activeStateCheck } = useValidations();
	// const { selectedAxis } = useMovementTuning();

	const validations = useMemo(
		() => [connectionValidation, activeStateCheck],
		[connectionValidation, activeStateCheck],
	);

	const getImage = (item: SecondaryContent, selectedAxis: string) => {
		return imageDict[`${selectedAxis}${item.content}`];
	};

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
					description: (
						<>
							<p className="mb-2">
								If you're looking to use your CNC for more accurate work and
								notice a specific axis is always off by a small amount - say
								102mm instead of 100 - then use this tool.
							</p>

							<p className="mb-2">
								Since CNC firmware needs to understand its hardware to make
								exact movements, small manufacturing variations in the motors,
								lead screws, pulleys, or incorrect firmware will create
								inaccuracies over longer distances.
							</p>

							<p className="mb-2">
								By testing for this difference using a marker or tape and a
								measuring tape, this tool will better tune the firmware to your
								machine.
							</p>
						</>
					),
					estimatedTime: "5 - 10 minutes",
					completionPage: Completion,
					context: useMovementTuning,
					steps: [
						{
							id: "landing",
							title: "Axis Selection",
							component: AxisSelection,
							secondaryContent: [
								{
									type: "image",
									content: "1",
									function: getImage,
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
						},
						{
							id: "first-location",
							title: "Mark First Location",
							component: MarkFirstLocation,
							secondaryContent: [
								{
									type: "image",
									content: "1",
									function: getImage,
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
									function: getImage,
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
									function: getImage,
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
