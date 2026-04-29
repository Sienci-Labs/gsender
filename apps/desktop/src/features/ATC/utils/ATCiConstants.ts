import { IconType } from 'react-icons';
export const ATCI_SUPPORTED_VERSION = 20250627;

export interface ToolStateTheme {
    label: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    backgroundStyle: 'solid' | 'striped-diagonal';
    icon: IconType;
}

export interface ToolStateThemes {
    // Primary States
    probed: ToolStateTheme;
    unprobed: ToolStateTheme;

    // Support Statuses
    empty: ToolStateTheme;
    current: ToolStateTheme;
    error: ToolStateTheme;
}

import { FaCheckCircle, FaExclamationCircle, FaBan } from 'react-icons/fa';
import { PiEmpty, PiHandTap } from 'react-icons/pi';
import { IoFlash } from 'react-icons/io5';

export const toolStateThemes: ToolStateThemes = {
    // Primary States
    probed: {
        label: 'Probed',
        backgroundColor: 'bg-green-500/20 dark:bg-green-500/40',
        borderColor: 'border-green-700',
        textColor: 'text-green-700',
        backgroundStyle: 'solid',
        icon: FaCheckCircle,
    },

    unprobed: {
        label: 'Unprobed',
        backgroundColor: 'bg-yellow-500/20 dark:bg-yellow-500/40',
        borderColor: 'border-yellow-700',
        textColor: 'text-yellow-700 dark:text-yellow-400',
        backgroundStyle: 'solid',
        icon: FaExclamationCircle,
    },

    // Support Statuses
    empty: {
        label: 'Empty',
        backgroundColor: 'bg-gray-400/20 dark:bg-gray-400/40',
        borderColor: 'border-gray-600',
        textColor: 'text-gray-600 dark:text-gray-300',
        backgroundStyle: 'solid',
        icon: PiEmpty,
    },

    current: {
        label: 'Current',
        backgroundColor: 'bg-robin-500/20 dark:bg-robin-500/40',
        borderColor: 'border-robin-700',
        textColor: 'text-robin-700 dark:text-robin-400',
        backgroundStyle: 'solid',
        icon: IoFlash,
    },

    error: {
        label: 'Error',
        backgroundColor: 'bg-red-600/20 dark:bg-red-500/40',
        borderColor: 'border-red-800',
        textColor: 'text-red-800 dark:text-red-500',
        backgroundStyle: 'striped-diagonal',
        icon: FaBan,
    },
};

export interface ManualChipTheme {
    labelLong: string;
    labelShort: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    icon: IconType;
}

export const manualChipTheme: ManualChipTheme = {
    labelLong: 'Manual',
    labelShort: '',
    backgroundColor: 'bg-sky-100/70 dark:bg-sky-400/20',
    borderColor: 'border-sky-400',
    textColor: 'text-sky-700 dark:text-sky-300',
    icon: PiHandTap,
};

// CSS classes for stripe patterns
export const stripePatterns = {
    'striped-diagonal': `
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(0, 0, 0, 0.1) 10px,
      rgba(0, 0, 0, 0.1) 20px
    );
  `,
};

// Helper function to get combined class names
export const getToolStateClasses = (state: keyof ToolStateThemes): string => {
    const theme = toolStateThemes[state];

    if (!theme) {
        return '';
    }
    return `${theme.backgroundColor} ${theme.borderColor} ${theme.textColor}`;
};
