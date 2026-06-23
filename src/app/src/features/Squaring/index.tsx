import { WizardManager } from "app/components/Wizard/WizardManager";
import { useNavigate } from "react-router";
import { SquaringProvider } from "./context/SquaringContext";
import { useXYSquaringWizard } from "./Steps/XYSquaring";

const Squaring = () => {
	const navigate = useNavigate();
	const canGoBack = window.history.length > 1;
	const wizard = useXYSquaringWizard();

	const onExit = () => (canGoBack ? navigate(-1) : navigate("/"));
	return (
		<SquaringProvider>
			<WizardManager wizard={wizard} onExit={onExit} />
		</SquaringProvider>
	);
};

export default Squaring;
