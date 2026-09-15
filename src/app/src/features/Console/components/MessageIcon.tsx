import {
    AlertTriangle,
    ChevronRight,
    CircleAlert,
    Cog,
    Dot,
    OctagonAlert,
} from 'lucide-react';
import type { ConsoleMessageType } from '../definitions';

const ICONS: Record<
    ConsoleMessageType,
    { Icon: typeof Dot; className: string; label: string }
> = {
    gcode: {
        Icon: ChevronRight,
        className: 'text-blue-500 dark:text-blue-300',
        label: 'Sent',
    },
    response: {
        Icon: Dot,
        className: 'text-gray-400 dark:text-content-muted',
        label: 'Response',
    },
    system: {
        Icon: Cog,
        className: 'text-green-500 dark:text-green-300',
        label: 'System',
    },
    warning: {
        Icon: AlertTriangle,
        className: 'text-orange-500 dark:text-orange-300',
        label: 'Warning',
    },
    error: {
        Icon: CircleAlert,
        className: 'text-red-500 dark:text-red-400',
        label: 'Error',
    },
    alarm: {
        Icon: OctagonAlert,
        className: 'text-red-600 dark:text-red-500',
        label: 'Alarm',
    },
};

/**
 * Colour lives on the icon so a fast-moving list stays readable - no rails,
 * badges or filled row backgrounds.
 */
export function MessageIcon({ type }: { type: ConsoleMessageType }) {
    const { Icon, className, label } = ICONS[type] ?? ICONS.response;

    return (
        <Icon
            className={`w-3.5 h-3.5 shrink-0 ${className}`}
            aria-label={label}
            role="img"
        />
    );
}

export default MessageIcon;
