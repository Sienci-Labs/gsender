import { createContext, useContext } from "react";

export const GeneralWizardContext = createContext({
	reset: () => {},
	onPrevious: () => {},
	onNext: () => {},
	getItemParams: () => {
		return "";
	},
});

export const useDefaultContext = () => {
	const context = useContext(GeneralWizardContext);
	if (context === undefined) {
		throw new Error("useSquaring must be used within a SquaringProvider");
	}
	return context;
};
