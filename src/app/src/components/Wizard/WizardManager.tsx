// if you only have one wizard and don't need a hub, import this component

/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import { useEffect, useRef, useState } from "react";
import type { SubWizard, Wizard } from "./types/wizard";
import { WizardContainer } from "./WizardContainer";
import { WizardLanding } from "./WizardLanding";

interface WizardManagerProps {
	wizard: Wizard;
	onExit?: () => void;
	isHub?: boolean;
	initialSubWizardId?: string;
}

export function WizardManager({
	wizard,
	onExit,
	isHub = false,
	initialSubWizardId,
}: WizardManagerProps) {
	const [selectedSubWizard, setSelectedSubWizard] = useState<SubWizard | null>(
		null,
	);
	const hasAutoSelected = useRef(false);

	useEffect(() => {
		if (isHub && wizard.subWizards.length === 1) {
			const allValid =
				!wizard.validations.length ||
				wizard.validations.every((v) => v().success);
			if (allValid) {
				setSelectedSubWizard(wizard.subWizards[0]);
			}
		}
	}, [wizard]);

	useEffect(() => {
		if (
			!isHub ||
			hasAutoSelected.current ||
			!initialSubWizardId ||
			!wizard.subWizards.length
		)
			return;
		const match = wizard.subWizards.find((sw) => sw.id === initialSubWizardId);
		if (match) {
			setSelectedSubWizard(match);
			hasAutoSelected.current = true;
		}
	}, [wizard, initialSubWizardId]);

	const handleSelectSubWizard = (subWizard: SubWizard) => {
		setSelectedSubWizard(subWizard);
	};

	const handleExitWizard = () => {
		setSelectedSubWizard(null);
	};

	return (
		<div className="h-full min-h-0 overflow-hidden">
			{selectedSubWizard ? (
				<WizardContainer
					subWizard={selectedSubWizard}
					onWizardExit={handleExitWizard}
				/>
			) : (
				<WizardLanding
					title={wizard.title}
					image={wizard.image}
					subWizards={wizard.subWizards}
					onSelectSubWizard={handleSelectSubWizard}
					onBack={onExit}
					validations={wizard.validations}
					helpUrl={wizard.helpUrl}
				/>
			)}
		</div>
	);
}
