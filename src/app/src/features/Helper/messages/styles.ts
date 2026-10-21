import {
    AlertOctagon,
    AlertTriangle,
    Bell,
    Info,
    Lightbulb,
    type LucideIcon,
    Wrench,
} from 'lucide-react';
import { tv } from 'tailwind-variants';
import type { HelperKind, HelperWeight } from './types';

// Class strings are written out in full so Tailwind's content scan keeps them.
// The custom brand scales are not pale at 50, so tints are *-500 at low opacity.
// Reminder/maintenance use the brand purple (50/100/200/400/600).
export const severity = tv({
    slots: {
        fg: '',
        tint: '',
        line: '',
        bar: '',
    },
    variants: {
        kind: {
            alarm: {
                fg: 'text-red-700 dark:text-red-100',
                tint: 'bg-red-500/10 dark:bg-red-500/15',
                line: 'border-red-500/30 dark:border-red-500/40',
                bar: 'bg-red-700 dark:bg-red-100',
            },
            error: {
                fg: 'text-orange-700 dark:text-orange-100',
                tint: 'bg-orange-500/10 dark:bg-orange-500/15',
                line: 'border-orange-500/30 dark:border-orange-500/40',
                bar: 'bg-orange-700 dark:bg-orange-100',
            },
            info: {
                fg: 'text-blue-700 dark:text-blue-300',
                tint: 'bg-blue-500/10 dark:bg-blue-500/15',
                line: 'border-blue-500/30 dark:border-blue-500/40',
                bar: 'bg-blue-700 dark:bg-blue-300',
            },
            reminder: {
                fg: 'text-purple-600 dark:text-purple-200',
                tint: 'bg-purple-400/10 dark:bg-purple-400/15',
                line: 'border-purple-400/40 dark:border-purple-400/50',
                bar: 'bg-purple-600 dark:bg-purple-200',
            },
            maintenance: {
                fg: 'text-purple-600 dark:text-purple-200',
                tint: 'bg-purple-400/10 dark:bg-purple-400/15',
                line: 'border-purple-400/40 dark:border-purple-400/50',
                bar: 'bg-purple-600 dark:bg-purple-200',
            },
            tip: {
                fg: 'text-green-700 dark:text-green-100',
                tint: 'bg-green-500/10 dark:bg-green-500/15',
                line: 'border-green-500/30 dark:border-green-500/40',
                bar: 'bg-green-700 dark:bg-green-100',
            },
        },
    },
    defaultVariants: {
        kind: 'info',
    },
});

// Neutral classes shared by every kind
export const neutral = {
    surface: 'bg-white dark:bg-surface-raised',
    divider: 'border-gray-200 dark:border-outline-subtle',
    panel: 'bg-gray-50 border-gray-200 dark:bg-surface-base dark:border-outline-subtle',
    title: 'text-gray-900 dark:text-content-primary',
    body: 'text-gray-700 dark:text-content-secondary',
    muted: 'text-gray-500 dark:text-content-muted',
    link: 'text-blue-600 hover:text-blue-700 dark:text-blue-300',
    track: 'bg-gray-200 dark:bg-surface-elevated',
};

interface KindMeta {
    icon: LucideIcon;
    label: string;
    defaultWeight: HelperWeight;
    // Higher rank replaces a lower one; lower ranks wait in the queue
    rank: number;
    // Alarm/error: alertdialog semantics, mono eyebrow, no dismiss on outside click
    critical: boolean;
}

export const KIND_META: Record<HelperKind, KindMeta> = {
    alarm: {
        icon: AlertOctagon,
        label: 'Alarm',
        defaultWeight: 'full',
        rank: 4,
        critical: true,
    },
    error: {
        icon: AlertTriangle,
        label: 'Error',
        defaultWeight: 'full',
        rank: 3,
        critical: true,
    },
    reminder: {
        icon: Bell,
        label: 'Reminder',
        defaultWeight: 'compact',
        rank: 2,
        critical: false,
    },
    maintenance: {
        icon: Wrench,
        label: 'Maintenance',
        defaultWeight: 'compact',
        rank: 2,
        critical: false,
    },
    info: {
        icon: Info,
        label: 'Info',
        defaultWeight: 'full',
        rank: 1,
        critical: false,
    },
    tip: {
        icon: Lightbulb,
        label: 'Tip',
        defaultWeight: 'minimal',
        rank: 0,
        critical: false,
    },
};
