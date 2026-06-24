/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import type { ComponentType, ContextType, ReactNode } from "react";
import type { GeneralWizardContext } from "../DefaultContext";

export interface WizardStep {
	id: string;
	title: string;
	component: ComponentType<StepProps>;
	secondaryContent?: SecondaryContent[];
	contextProvider?: ComponentType<{ children: ReactNode }>;
	fillPrimaryContent?: boolean;
	autoComplete?: () => boolean;
}

export interface StepProps {
	onComplete: () => void;
	onUncomplete: () => void;
	data?: Record<string, any>;
	onDataChange?: (data: Record<string, any>) => void;
}

export interface SecondaryContent {
	type: "image" | "component" | "link" | "video";
	content: string | ComponentType<any>;
	title?: string;
	url?: string;
	props?: Record<string, any>;
	fill?: boolean;
	function?: (item: SecondaryContent, params: any) => string;
}

export interface SubWizard {
	id: string;
	title: string;
	description?: string | ReactNode;
	estimatedTime?: string;
	configVersion?: string;
	steps: WizardStep[];
	icon?: ComponentType<any>;
	completionPage?: ComponentType<any>;
	completionImage?: string;
	secondaryContentLeft?: boolean;
	hideVersionPrintout?: boolean;
	context?: () => ContextType<typeof GeneralWizardContext>
}

export interface ValidationResult {
	success: boolean;
	reason?: ReactNode;
}

export interface Wizard {
	id: string;
	title: string;
	image?: string;
	subWizards: SubWizard[];
	validations: (() => ValidationResult)[];
	helpUrl?: string;
}
