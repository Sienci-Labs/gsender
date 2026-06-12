/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import type { SubWizard } from "app/features/AccessoryInstaller/types/wizard";
import { useState } from "react";
import { useMovementTuningWizard } from "../Steps/MovementTuning";
import { WizardContainer } from "./WizardContainer";
import { WizardLanding } from "./WizardLanding";

interface WizardManagerProps {
	onExit?: () => void;
}

export function WizardManager({ onExit }: WizardManagerProps) {
	const wizard = useMovementTuningWizard();
	const [selectedSubWizard, setSelectedSubWizard] = useState<SubWizard | null>(
		null,
	);

	const handleSelectSubWizard = (subWizard: SubWizard) => {
		setSelectedSubWizard(subWizard);
	};

	const handleExitWizard = () => {
		setSelectedSubWizard(null);
		onExit();
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
					onBack={onExit}
					onSelectSubWizard={handleSelectSubWizard}
					validations={wizard.validations}
					helpUrl={wizard.helpUrl}
				/>
			)}
		</div>
	);
}
