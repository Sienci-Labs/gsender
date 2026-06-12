import { useNavigate } from "react-router";
import { MovementTuningProvider } from "./utils/MovementTuningContext";
import { WizardManager } from "./utils/WizardManager";

const MovementTuning = () => {
	const navigate = useNavigate();
	const canGoBack = window.history.length > 1;

	const onExit = () => (canGoBack ? navigate(-1) : navigate("/"));
	return (
		<MovementTuningProvider>
			<WizardManager onExit={onExit} />
		</MovementTuningProvider>
	);
};

export default MovementTuning;
