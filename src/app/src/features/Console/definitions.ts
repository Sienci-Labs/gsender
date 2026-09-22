export interface Console {
    minimized: boolean;
}

/**
 * Why a line was written, attached by the code that produced it rather than
 * inferred by the renderer. See consoleStore.consoleWrite.
 */
export type ConsoleMessageType =
    | 'gcode'
    | 'response'
    | 'system'
    | 'warning'
    | 'error'
    | 'alarm';

export interface ConsoleMessage {
    id: string;
    message: string;
    type: ConsoleMessageType;
}

export type ConsoleFilter = 'all' | 'gcode' | 'response' | 'system' | 'faults';

export const CONSOLE_FILTERS: {
    id: ConsoleFilter;
    label: string;
}[] = [
    { id: 'all', label: 'All' },
    { id: 'gcode', label: 'G-code' },
    { id: 'response', label: 'Responses' },
    { id: 'system', label: 'System' },
    { id: 'faults', label: 'Faults' },
];

export function matchesFilter(
    message: ConsoleMessage,
    filter: ConsoleFilter,
): boolean {
    if (filter === 'all') {
        return true;
    }

    // Everything that went wrong shares one filter: an operator looking for a
    // problem does not know in advance whether it was reported as a warning, an
    // error or an alarm.
    if (filter === 'faults') {
        return (
            message.type === 'warning' ||
            message.type === 'error' ||
            message.type === 'alarm'
        );
    }

    return message.type === filter;
}
