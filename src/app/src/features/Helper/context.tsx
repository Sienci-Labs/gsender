/*
 * Copyright (C) 2022 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */
/** biome-ignore-all lint/complexity/useOptionalChain: <> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */

import type { BasicObject } from "app/definitions/general";
import { Toaster } from "app/lib/toaster/ToasterLib";
import reduxStore from "app/store/redux";
import { disableWizard } from "app/store/redux/slices/helper.slice";
import type { WizardInstructions, WizardStep } from "app/wizards/definitions";
import _ from "lodash";
import {
	createContext,
	type Dispatch,
	type JSX,
	type SetStateAction,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

interface ActiveValues {
	activeStep: number;
	activeSubstep: number;
}

const initialState: {
	completedStep: number;
	setCompletedStep?: Dispatch<SetStateAction<number>>;
	completedSubStep: number;
	setCompletedSubStep?: Dispatch<SetStateAction<number>>;
	intro: string;
	setIntro?: Dispatch<SetStateAction<string>>;
	toolchangeContext: BasicObject;
	setToolchangeContext?: Dispatch<SetStateAction<BasicObject>>;
	toolchangeComment: string;
	setToolchangeComment?: Dispatch<SetStateAction<string>>;
	activeStep: number;
	setActiveStep?: Dispatch<SetStateAction<number>>;
	activeSubstep: number;
	setActiveSubstep?: Dispatch<SetStateAction<number>>;
	title: string;
	setTitle?: Dispatch<SetStateAction<string>>;
	steps: WizardStep[];
	setSteps?: Dispatch<SetStateAction<WizardStep[]>>;
	visible: boolean;
	setVisible?: Dispatch<SetStateAction<boolean>>;
	stepCount: number;
	setStepCount?: Dispatch<SetStateAction<number>>;
	minimized: boolean;
	setMinimized?: Dispatch<SetStateAction<boolean>>;
	isLoading: boolean;
	setIsLoading?: Dispatch<SetStateAction<boolean>>;
	overlay: boolean;
	setOverlay?: Dispatch<SetStateAction<boolean>>;
	load: (
		instructions: WizardInstructions,
		title: string,
		metadata?: BasicObject,
	) => void;
} = {
	steps: [
		{
			title: "",
			substeps: [],
		},
	],
	activeStep: 0,
	activeSubstep: 0,
	completedStep: -1,
	completedSubStep: -1,
	title: "",
	visible: false,
	load: () => {},
	stepCount: 0,
	minimized: false,
	isLoading: false,
	overlay: false,
	intro: "",
	toolchangeContext: {},
	toolchangeComment: "",
};

const initialAPI: {
	setWizardSteps: (steps: WizardStep[]) => void;
	setTitle: (title: string) => void;
	setVisible: (b: boolean) => void;
	setIsLoading: (state: boolean) => void;
	updateSubstepOverlay: (
		activeValues: ActiveValues,
		stepsList?: WizardStep[],
	) => boolean;
	getStepTitle: (index: number) => string;
	getIntro: () => string;
	getSubsteps: (index: number) => {
		title: string;
		description: string | (() => JSX.Element) | (() => string);
		overlay: boolean;
		toolBanner?: boolean;
		actions?: {
			label: string;
			gcodeLines?: string[];
			cb?: () => void;
		}[];
		actionTaken?: boolean;
	}[];
	incrementStep: () => void;
	decrementStep: () => ActiveValues | BasicObject;
	toggleMinimized: (state: boolean) => void;
	completeSubStep: (stepIndex?: number, substepIndex?: number) => BasicObject;
	isSubstepCompleted: (stepIndex: number, substepIndex: number) => boolean;
	load: (
		instructions: WizardInstructions,
		title: string,
		metadata?: BasicObject & { context?: BasicObject; comment?: string },
	) => void;
	scrollToActiveStep: (activeValues: ActiveValues) => void;
	markActionAsComplete: (stepIndex: number, substepIndex: number) => void;
	hasIncompleteActions: () => boolean;
	cancelToolchange: () => void;
} = {
	setWizardSteps: () => {},
	setTitle: () => {},
	setVisible: () => {},
	setIsLoading: () => {},
	updateSubstepOverlay: () => {
		return false;
	},
	getStepTitle: () => {
		return "";
	},
	getIntro: () => {
		return "";
	},
	getSubsteps: () => {
		return null;
	},
	incrementStep: () => {},
	decrementStep: () => {
		return {};
	},
	toggleMinimized: () => {},
	completeSubStep: () => {
		return {};
	},
	isSubstepCompleted: () => {
		return false;
	},
	load: () => {},
	scrollToActiveStep: () => {},
	markActionAsComplete: () => {},
	hasIncompleteActions: () => {
		return false;
	},
	cancelToolchange: () => {},
};

const WizardContext = createContext(initialState);
const WizardAPI = createContext(initialAPI);

/**
 * Wizard Context Provider
 * @param children child elements
 * @returns {JSX.Element}
 */
export const WizardProvider = ({
	children,
}: {
	children: JSX.Element;
}): JSX.Element => {
	const [completedStep, setCompletedStep] = useState(-1);
	const [completedSubStep, setCompletedSubStep] = useState(-1);
	const [intro, setIntro] = useState(null);
	const [toolchangeContext, setToolchangeContext] = useState<BasicObject>(null);
	const [toolchangeComment, setToolchangeComment] = useState("");
	const [activeStep, setActiveStep] = useState(0);
	const [activeSubstep, setActiveSubstep] = useState(0);
	const [title, setTitle] = useState("Wizard");
	const [steps, setSteps] = useState<WizardStep[]>([
		{
			title: "",
			substeps: [],
		},
	]);
	const [visible, setVisible] = useState(false);
	const [stepCount, setStepCount] = useState(0);
	const [minimized, setMinimized] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [overlay, setOverlay] = useState(false);

	// Auto-close when activeStep reaches or exceeds stepCount.
	// completeSubStep sets activeStep = lastStep+1 before setVisible(false);
	// if the close branch is missed due to a stale closure, this catches it.
	useEffect(() => {
		if (visible && stepCount > 0 && activeStep >= stepCount) {
			setVisible(false);
			setCompletedStep(-1);
			setCompletedSubStep(-1);
			setActiveStep(0);
			setActiveSubstep(0);
			setTitle("Wizard");
			setSteps([]);
			setIntro(null);
			setToolchangeContext(null);
			setToolchangeComment("");
			setStepCount(0);
			setMinimized(false);
			reduxStore.dispatch(disableWizard());
		}
	}, [activeStep, stepCount, visible]);

	// Memoized API for context, can be fetched separate to data context
	const api = useMemo(
		() => ({
			setWizardSteps: (steps: WizardStep[]) => setSteps(steps),
			setTitle: (title: string) => setTitle(title),
			setVisible: (b: boolean) => setVisible(b),
			setIsLoading: (state: boolean) => setIsLoading(state),
			updateSubstepOverlay: (activeValues: ActiveValues, stepsList = steps) => {
				const { activeStep, activeSubstep } = activeValues;
				const step = stepsList[activeStep];
				if (!step) {
					return false;
				}
				const substep = step.substeps[activeSubstep];
				if (!substep) {
					return false;
				}
				setOverlay(substep.overlay);
				return substep.overlay;
			},
			getStepTitle: (index: number) => {
				const step = steps[index];
				if (!step) {
					return "";
				}
				return step.title;
			},
			getIntro: () => {
				return intro;
			},
			getSubsteps: (index: number) => {
				const step = steps[index];
				if (!step) {
					return [];
				}
				return step.substeps;
			},
			incrementStep: () => {
				const maxStepIndex = stepCount - 1;
				if (activeStep < maxStepIndex) {
					setActiveStep(activeStep + 1);
				}
			},
			decrementStep: (): ActiveValues | BasicObject => {
				// first check if we have substeps
				if (activeSubstep > 0) {
					const decrementedSubStep = activeSubstep - 1;
					setActiveSubstep(decrementedSubStep);
					return {
						activeStep: activeStep,
						activeSubstep: decrementedSubStep,
					};
				}
				// if not, go back to previous step
				const decrementedStep = activeStep - 1;
				if (decrementedStep >= 0) {
					setActiveStep(decrementedStep);
					// make sure we dont go to the very beginning of the step
					// go to the last substep
					const step = steps[decrementedStep];
					const numberOfSubSteps = step.substeps.length;
					const newSubstep = numberOfSubSteps - 1;
					setActiveSubstep(newSubstep);
					return {
						activeStep: decrementedStep,
						activeSubstep: newSubstep,
					};
				}
				return {};
			},
			toggleMinimized: (state: boolean) => {
				setMinimized(!state);
			},
			completeSubStep: (
				stepIndex = activeStep,
				substepIndex = activeSubstep,
			) => {
				// check that more steps can be completed
				const maxStepIndex = stepCount - 1;
				if (stepIndex > maxStepIndex) {
					return {};
				}
				let returnValues = {};

				// ACTIVE****
				const step = steps[stepIndex];
				const numberOfSubSteps = step.substeps.length;
				const nextStep = substepIndex + 1;
				// Completed all substeps, move to next step
				if (nextStep >= numberOfSubSteps) {
					setActiveStep(stepIndex + 1);
					setActiveSubstep(0);
					returnValues = {
						activeStep: stepIndex + 1,
						activeSubstep: 0,
					};
					if (stepIndex >= maxStepIndex) {
						// reset values
						document.getElementById("step-0-0")?.scrollIntoView();
						setVisible(false);
						setCompletedStep(-1);
						setCompletedSubStep(-1);
						setActiveStep(0);
						setActiveSubstep(0);
						setTitle("Wizard");
						setSteps([]);
						setIntro(null);
						setToolchangeContext(null);
						setToolchangeComment("");
						setStepCount(0);
						setMinimized(false);
						reduxStore.dispatch(disableWizard());
						return {};
					}
				} else {
					// didnt complete substeps, so increment substep only
					setActiveSubstep(nextStep);
					returnValues = {
						activeStep: stepIndex,
						activeSubstep: nextStep,
					};
				}
				// close window on everything done.
				if (activeStep >= maxStepIndex) {
					// reset values
					document.getElementById("step-0-0")?.scrollIntoView();
					setVisible(false);
					setCompletedStep(-1);
					setCompletedSubStep(-1);
					setActiveStep(0);
					setActiveSubstep(0);
					setTitle("Wizard");
					setSteps([]);
					setIntro(null);
					setToolchangeContext(null);
					setToolchangeComment("");
					setStepCount(0);
					setMinimized(false);
					return {};
				}

				// check that the step we are completed has not already been completed
				if (
					completedStep >= stepIndex ||
					(stepIndex === completedStep + 1 && completedSubStep >= substepIndex)
				) {
					return returnValues;
				}

				// COMPLETED****
				if (nextStep >= numberOfSubSteps) {
					setCompletedStep(stepIndex);
					setCompletedSubStep(-1);
				} else {
					setCompletedSubStep(substepIndex);
				}
				return returnValues;
			},
			isSubstepCompleted: (stepIndex: number, substepIndex: number) => {
				if (completedStep > stepIndex) {
					return true;
				}
				return completedSubStep > substepIndex && stepIndex === completedStep;
			},
			load: (
				instructions: WizardInstructions,
				title: string,
				metadata?: BasicObject & { context?: BasicObject; comment?: string },
			) => {
				if (!instructions || !instructions.steps) {
					return;
				}
				instructions.steps.forEach((step) => {
					step.substeps.forEach((substep) => {
						if (substep.actions) {
							substep.actionTaken = false;
						}
					});
				});
				// Sets up steps, and restores default state for new wizard
				setSteps([...instructions.steps]);
				setStepCount(instructions.steps.length);
				setTitle(title);
				setIntro(instructions.intro?.description ?? null);
				setToolchangeContext(metadata.context ?? null);
				setToolchangeComment(metadata.comment ?? "");

				setActiveStep(0);
				setVisible(true);
			},
			// you must pass an object with activeStep and activeSubstep to this function.
			// this is bc if you change those values before running this function, they won't update in time,
			// and you will get the old values.
			// completeSubStep and decrementStep both return the new values they set that can then be passed to this function
			scrollToActiveStep: (activeValues: ActiveValues) => {
				if (_.isEmpty(activeValues)) {
					return;
				}
				const { activeStep, activeSubstep } = activeValues;
				if (activeStep > steps.length) {
					return;
				}
				requestAnimationFrame(() => {
					const element = document.getElementById(
						`step-${activeStep}-${activeSubstep}`,
					);
					if (!element) return;
					element.scrollIntoView({
						behavior: "smooth",
						block: "center",
					});
				});
			},
			markActionAsComplete: (stepIndex: number, substepIndex: number) => {
				const nextSteps = [...steps];
				nextSteps[stepIndex].substeps[substepIndex].actionTaken = true;
				setSteps(nextSteps);
				setActiveStep(stepIndex);
				setActiveSubstep(substepIndex);
			},
			hasIncompleteActions: () => {
				const step = steps[activeStep];
				if (!step) {
					return false;
				}
				const substep = step.substeps[activeSubstep];
				if (!substep || !substep.actions) {
					return false;
				}

				return substep.actions.length > 0 && substep.actionTaken === false;
			},
			cancelToolchange: () => {
				document.getElementById("step-0-0")?.scrollIntoView();
				setVisible(false);
				setCompletedStep(-1);
				setCompletedSubStep(-1);
				setActiveStep(0);
				setActiveSubstep(0);
				setTitle("Wizard");
				setSteps([]);
				setIntro(null);
				setToolchangeContext(null);
				setToolchangeComment("");
				setStepCount(0);
				setMinimized(false);
				setIsLoading(false);
				reduxStore.dispatch(disableWizard());

				Toaster.clear();
			},
		}),
		[
			setActiveStep,
			setSteps,
			setTitle,
			setVisible,
			steps,
			stepCount,
			activeStep,
			activeSubstep,
			completedStep,
			completedSubStep,
			isLoading,
			overlay,
			setMinimized,
			setActiveSubstep,
		],
	);

	return (
		<WizardContext.Provider
			value={{
				steps,
				activeStep,
				activeSubstep,
				completedStep,
				completedSubStep,
				title,
				visible,
				load: api.load,
				stepCount,
				minimized,
				isLoading,
				overlay,
				intro,
				toolchangeContext,
				toolchangeComment,
			}}
		>
			<WizardAPI.Provider value={api}>{children}</WizardAPI.Provider>
		</WizardContext.Provider>
	);
};

/**
 * Fetches and returns current context for Wizard tool.  Throws error if not inside provider scope.
 * @returns current react context
 */
export const useWizardContext = () => {
	const context = useContext(WizardContext);
	if (!context) {
		throw new Error(
			"Context unavailable - make sure this is being used within the wizard context provider",
		);
	}
	return context;
};

/**
 * Fetches and returns the API context for Wizard tool.  Throws error if not inside provider scope.
 * @returns Current API context
 */
export const useWizardAPI = () => {
	const context = useContext(WizardAPI);
	if (!context) {
		throw new Error(
			"Context unavailable - make sure this is being used within the Wizard API context provider",
		);
	}
	return context;
};
