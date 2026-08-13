import { useValidations } from "app/components/Wizard/hooks/UseValidations.tsx";
import type { Wizard } from "app/components/Wizard/types";
import { Jogging } from "app/features/Jogging";
import { useMemo } from "react";
import XYSquaringExample from "../assets/XY_squaring_example.jpg";
import TriangleDiagram from "../components/TriangleDiagram";
import { useSquaring } from "../context/SquaringContext";
import Landing from "./Landing";
import MarkingStep from "./MarkingStep";
import MeasurementStep from "./MeasurementStep";
import ResultsStep from "./ResultsStep";

export function useXYSquaringWizard(): Wizard {
	const { connectionValidation, activeStateCheck } = useValidations();

	const validations = useMemo(
		() => [connectionValidation, activeStateCheck],
		[connectionValidation, activeStateCheck],
	);

	return useMemo<Wizard>(
		() => ({
			id: "xy-squaring",
			title: "XY Squaring",
			image: XYSquaringExample,
			validations: [...validations],
			helpUrl: "https://resources.sienci.com/view/gs-calibration-tools/",
			subWizards: [
				{
					id: "initial-setup",
					title: "XY Squaring",
					description: `If your CNC is making skewed cuts (pictured), it's because
								the X and Y axes aren't squared to each other. This can be
								fixed.`,
					estimatedTime: "5 - 10 minutes",
					completionPage: ResultsStep,
					context: useSquaring,
					steps: [
						{
							id: "landing",
							title: "Initial Setup",
							component: Landing,
							secondaryContent: [
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
							id: "mark-locations",
							title: "Mark Locations",
							component: MarkingStep,
							secondaryContent: [
								{
									type: "component",
									content: TriangleDiagram,
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
							title: "Measure Distances",
							component: MeasurementStep,
							secondaryContent: [
								{
									type: "component",
									content: TriangleDiagram,
								},
								{
									type: "link",
									title: "Need help?",
									content: "Follow along in our",
									url: "https://resources.sienci.com/view/gs-calibration-tools/",
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
