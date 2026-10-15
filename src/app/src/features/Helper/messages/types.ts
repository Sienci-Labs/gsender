import type { ReactNode } from 'react';

export type HelperKind =
    | 'alarm'
    | 'error'
    | 'info'
    | 'reminder'
    | 'maintenance'
    | 'tip';
export type HelperWeight = 'full' | 'compact' | 'minimal';

export interface HelperResource {
    label: string;
    url: string;
    // Show the "Open guide" link (default true)
    link?: boolean;
    // Show the QR code (default true)
    qr?: boolean;
}

export interface HelperAction {
    label: string;
    // The dialog closes after onClick unless it returns false
    onClick?: () => void | false;
}

export interface HelperChecklistItem {
    id: string;
    label: string;
}

export interface HelperProgress {
    label: string;
    value: number;
    max: number;
    unit?: string;
}

export interface HelperMessage {
    kind?: HelperKind;
    weight?: HelperWeight;
    code?: string | number;
    // Overrides the kind label in the eyebrow
    eyebrow?: string;
    title: string;
    description: ReactNode;
    // "Try this" list, full weight only
    steps?: string[];
    // Free-form slot rendered under the steps
    content?: ReactNode;
    checklist?: HelperChecklistItem[];
    progress?: HelperProgress;
    resource?: HelperResource;
    primaryAction?: HelperAction;
    secondaryAction?: HelperAction;
    // Text link on the left of the footer
    tertiaryAction?: HelperAction;
    // Enables "Don't remind me again" / "Don't show tips"
    dismissKey?: string;
}

// A message after normalizeHelperMessage: kind and weight are always set
export type NormalizedHelperMessage = HelperMessage & {
    kind: HelperKind;
    weight: HelperWeight;
};

// Payload accepted on 'helper:info'. Older publishers send qrCode/resourceLink.
export type HelperPayload = Partial<HelperMessage> & {
    qrCode?: string;
    resourceLink?: string;
};

export interface ControllerCodeText {
    message?: string;
    description?: string;
}

// Controller state needed to fill in alarm/error text, passed in so
// normalize stays free of store imports
export interface HelperNormalizeContext {
    controllerType?: string;
    // grblHAL's own alarm descriptions (controller.settings.alarms)
    controllerAlarms?: { [code: number]: ControllerCodeText };
    isDismissed?: (key: string) => boolean;
}
