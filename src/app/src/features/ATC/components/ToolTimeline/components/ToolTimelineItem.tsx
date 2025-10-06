import cn from 'classnames';
import { ToolChange } from './types';

interface ToolTimelineItemProps {
    tool: ToolChange;
    isActive: boolean;
    isLast: boolean;
    progress: number;
}

export function ToolTimelineItem({
    tool,
    isActive,
    isLast,
    progress,
}: ToolTimelineItemProps) {
    return (
        <div className="relative">
            <div
                className={cn(
                    'relative rounded-lg p-3 transition-all duration-300 border backdrop-blur-xl',
                    isActive
                        ? 'bg-white/90 dark:bg-gray-800/90 shadow-2xl scale-[1.02] border-white/30 dark:border-gray-700/30'
                        : 'bg-white/60 dark:bg-gray-800/60 shadow-lg border-white/20 dark:border-gray-700/20',
                )}
                style={{
                    borderLeftWidth: isActive ? '4px' : '2px',
                    borderLeftColor: isActive ? tool.color : 'transparent',
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                        <div
                            className={cn(
                                'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-3 transition-all duration-300',
                                isActive
                                    ? 'scale-110 border-white shadow-lg'
                                    : 'border-white/80 dark:border-gray-600',
                            )}
                            style={{
                                backgroundColor: tool.color,
                                borderWidth: '3px',
                            }}
                        >
                            <span className="text-sm font-bold text-white">
                                T{tool.toolNumber}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <span
                                className={cn(
                                    'text-sm font-semibold transition-colors',
                                    isActive
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-700 dark:text-gray-300',
                                )}
                            >
                                {tool.label || `Tool ${tool.toolNumber}`}
                            </span>
                            {tool.startLine && (
                                <span
                                    className={cn(
                                        'text-xs transition-colors whitespace-nowrap',
                                        isActive
                                            ? 'text-gray-600 dark:text-gray-400'
                                            : 'text-gray-500 dark:text-gray-500',
                                    )}
                                >
                                    Line {tool.startLine}
                                    {tool.endLine && ` - ${tool.endLine}`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {isActive && (
                    <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${progress}%`,
                                backgroundColor: tool.color,
                            }}
                        />
                    </div>
                )}
            </div>

            {!isLast && (
                <div className="flex justify-center py-1">
                    <div
                        className={cn(
                            'w-0.5 h-4 rounded-full transition-all duration-300',
                            isActive
                                ? 'bg-gray-400 dark:bg-gray-500'
                                : 'bg-gray-300/50 dark:bg-gray-600/50',
                        )}
                    />
                </div>
            )}
        </div>
    );
}
