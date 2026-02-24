import type { ComponentType, ReactNode } from 'react';

export interface WizardStep {
    id: string;
    title: string;
    component: ComponentType<StepProps>;
    secondaryContent?: SecondaryContent[];
    contextProvider?: ComponentType<{ children: ReactNode }>;
    fillPrimaryContent?: boolean;
}

export interface StepProps {
    onComplete: () => void;
    onUncomplete: () => void;
    data?: Record<string, any>;
    onDataChange?: (data: Record<string, any>) => void;
}

export interface SecondaryContent {
    type: 'image' | 'component' | 'link';
    content: string | ComponentType<any>;
    title?: string;
    url?: string;
    props?: Record<string, any>;
    fill?: boolean;
}

export interface SubWizard {
    id: string;
    title: string;
    description?: string;
    estimatedTime?: string;
    configVersion?: string;
    steps: WizardStep[];
    icon?: ComponentType<any>;
    completionPage?: ComponentType<any>;
    secondaryContentLeft?: boolean;
    hideVersionPrintout?: boolean;
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
