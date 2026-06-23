import { WizardManager } from "app/components/Wizard/WizardManager";
import { useNavigate } from "react-router";
import { useMovementTuningWizard } from "./Steps/MovementTuning";
import { MovementTuningProvider } from "./utils/MovementTuningContext";

const MovementTuning = () => {
	const navigate = useNavigate();
	const canGoBack = window.history.length > 1;
	const wizard = useMovementTuningWizard();

	const onExit = () => (canGoBack ? navigate(-1) : navigate("/"));
	return (
		<MovementTuningProvider>
			<WizardManager wizard={wizard} onExit={onExit} isHub={false} />
		</MovementTuningProvider>
	);
};

export default MovementTuning;
