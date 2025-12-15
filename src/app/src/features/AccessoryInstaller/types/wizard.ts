export interface WizardStep {
    id: string;
    title: string;
    component: React.ComponentType<StepProps>;
    secondaryContent?: SecondaryContent[];
}

export interface StepProps {
    onComplete: () => void;
    onUncomplete: () => void;
    data?: Record<string, any>;
    onDataChange?: (data: Record<string, any>) => void;
}

export interface SecondaryContent {
    type: 'image' | 'component' | 'link';
    content: string | React.ComponentType<any>;
    title?: string;
    url?: string;
}

export interface SubWizard {
    id: string;
    title: string;
    description?: string;
    estimatedTime?: string;
    configVersion?: string;
    steps: WizardStep[];
    icon?: React.ComponentType<any>;
    completionPage?: React.ComponentType<any>;
}

export interface ValidationResult {
    success: boolean;
    reason?: string;
}

export interface Wizard {
    id: string;
    title: string;
    subWizards: SubWizard[];
    validations: (() => ValidationResult)[];
}
