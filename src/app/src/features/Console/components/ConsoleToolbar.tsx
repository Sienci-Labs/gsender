import Tooltip from 'app/components/Tooltip';
import { Copy, Eraser, ExternalLink } from 'lucide-react';
import {
    CONSOLE_FILTERS,
    type ConsoleFilter,
    type ConsoleMessageType,
} from '../definitions';

/**
 * Dots echo the row icon colours so a filter reads as the same family as the
 * messages it shows. 'all' gets none.
 */
const FILTER_DOT: Partial<Record<ConsoleFilter, string>> = {
    gcode: 'bg-blue-500',
    response: 'bg-gray-400',
    system: 'bg-green-500',
    warning: 'bg-orange-500',
    alarm: 'bg-red-600',
};

type Props = {
    filter: ConsoleFilter;
    onFilterChange: (filter: ConsoleFilter) => void;
    onCopy: () => void;
    onClear: () => void;
    onPopout?: () => void;
    showPopout?: boolean;
};

function ToolbarAction({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <Tooltip content={label}>
            <button
                type="button"
                onClick={onClick}
                aria-label={label}
                // Icon is small, target is not.
                className="flex items-center justify-center w-10 h-10 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200 dark:text-content-muted dark:hover:text-content-primary dark:hover:bg-overlay-hover dark:active:bg-overlay-active"
            >
                {children}
            </button>
        </Tooltip>
    );
}

export function ConsoleToolbar({
    filter,
    onFilterChange,
    onCopy,
    onClear,
    onPopout,
    showPopout = true,
}: Props) {
    return (
        <div className="flex items-center justify-between gap-2">
            <div
                role="group"
                aria-label="Filter console messages"
                className="flex items-center gap-0.5 overflow-x-auto"
                style={{ scrollbarWidth: 'none' }}
            >
                {CONSOLE_FILTERS.map(({ id, label }) => {
                    const selected = filter === id;
                    const dot = FILTER_DOT[id];

                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => onFilterChange(id)}
                            aria-pressed={selected}
                            className={`flex items-center gap-1 shrink-0 h-10 px-2 rounded text-xs font-medium transition-colors ${
                                selected
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-content-secondary dark:hover:bg-overlay-hover'
                            }`}
                        >
                            {dot && (
                                <span
                                    aria-hidden="true"
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        selected ? 'bg-white' : dot
                                    }`}
                                />
                            )}
                            {label}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
                <ToolbarAction label="Copy last 50 messages" onClick={onCopy}>
                    <Copy className="w-4 h-4" />
                </ToolbarAction>
                <ToolbarAction label="Clear console" onClick={onClear}>
                    <Eraser className="w-4 h-4" />
                </ToolbarAction>
                {showPopout && onPopout && (
                    <ToolbarAction label="Pop out console" onClick={onPopout}>
                        <ExternalLink className="w-4 h-4" />
                    </ToolbarAction>
                )}
            </div>
        </div>
    );
}

export default ConsoleToolbar;
