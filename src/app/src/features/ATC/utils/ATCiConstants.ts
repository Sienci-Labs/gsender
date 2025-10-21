import { IconType } from 'react-icons';
export const ATCI_SUPPORTED_VERSION = 250627;

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
    offrack: ToolStateTheme;

    // Support Statuses
    used: ToolStateTheme;
    current: ToolStateTheme;
    error: ToolStateTheme;
}

import { FaCheckCircle, FaExclamationCircle, FaBan } from 'react-icons/fa';
import { PiHandTap } from 'react-icons/pi';
import { MdRefresh } from 'react-icons/md';
import { IoFlash } from 'react-icons/io5';

export const toolStateThemes: ToolStateThemes = {
    // Primary States
    probed: {
        label: 'Probed',
        backgroundColor: 'bg-green-500/20',
        borderColor: 'border-green-700',
        textColor: 'text-green-700',
        backgroundStyle: 'solid',
        icon: FaCheckCircle,
    },

    unprobed: {
        label: 'Unprobed',
        backgroundColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-700',
        textColor: 'text-yellow-700',
        backgroundStyle: 'solid',
        icon: FaExclamationCircle,
    },

    offrack: {
        label: 'Manual',
        backgroundColor: 'bg-orange-500/20',
        borderColor: 'border-orange-700',
        textColor: 'text-orange-700',
        backgroundStyle: 'solid',
        icon: PiHandTap,
    },

    // Support Statuses
    used: {
        label: 'Used',
        backgroundColor: 'bg-gray-600/20',
        borderColor: 'border-gray-800',
        textColor: 'text-black',
        backgroundStyle: 'striped-diagonal',
        icon: MdRefresh,
    },

    current: {
        label: 'Current',
        backgroundColor: 'bg-robin-500/20',
        borderColor: 'border-robin-700',
        textColor: 'text-robin-700',
        backgroundStyle: 'solid',
        icon: IoFlash,
    },

    error: {
        label: 'Error',
        backgroundColor: 'bg-red-600/20',
        borderColor: 'border-red-800',
        textColor: 'text-red-800',
        backgroundStyle: 'striped-diagonal',
        icon: FaBan,
    },
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
    return `${theme.backgroundColor} ${theme.borderColor} ${theme.textColor}`;
};
