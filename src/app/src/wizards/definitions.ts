/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import type { JSX } from "react";

export interface WizardStep {
    title: string;
    substeps: {
        title: string;
        description: string | (() => JSX.Element) | (() => string);
        overlay: boolean;
        toolBanner?: boolean;
        actions?: {
            label: string;
            gcodeLines?: string[];
            cb?: () => void,
        }[];
        actionTaken?: boolean;
    }[];
};

export interface WizardInstructions {
    intro: {
        icon: string;
        description: string;
    };
    firstRunOnly?: boolean;
    onStart: () => any;
    steps: WizardStep[];
}