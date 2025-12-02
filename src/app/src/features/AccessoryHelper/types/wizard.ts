export type ActionType = 'check' | 'button' | 'component';

export type StatusType = 'success' | 'warning' | 'error' | 'info';

export interface WizardAction {
    id: string;
    type: ActionType;
    label: string;
    command?: string;
    componentName?: string;
    required?: boolean;
    completed?: boolean;
}

export interface SubStep {
    id: string;
    title: string;
    description?: string;
    actions: WizardAction[];
    completed?: boolean;
}

export interface WizardStep {
    id: string;
    title: string;
    description?: string;
    substeps?: SubStep[];
    actions?: WizardAction[];
    images?: string[];
    links?: Array<{ url: string; label: string }>;
    componentName?: string;
    completed?: boolean;
}

export interface Wizard {
    id: string;
    name: string;
    description: string;
    category: string;
    requiredItems?: string[];
    estimatedTime?: string;
    steps: WizardStep[];
    thumbnail?: string;
}

export interface FeedbackMessage {
    id: string;
    type: StatusType;
    message: string;
    timestamp: number;
    stepId?: string;
}

export interface WizardProgress {
    wizardId: string;
    completedSteps: string[];
    completed: boolean;
    lastUpdated: number;
}
