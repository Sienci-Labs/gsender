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
}: ToolTimelineItemProps) {
    return (
        <div className="relative">
            <div
                className={cn(
                    'relative rounded-lg transition-all duration-300 backdrop-blur-xl overflow-hidden',
                    isActive
                        ? 'bg-white/90 dark:bg-gray-800/90 shadow-2xl scale-[1.02] border-2 p-3'
                        : 'bg-white/40 dark:bg-gray-800/30 shadow-lg border border-white/20 dark:border-gray-700/20 opacity-60 p-2',
                )}
                style={{
                    borderLeftWidth: isActive ? '4px' : '2px',
                    borderLeftColor: isActive ? tool.color : 'transparent',
                    borderColor: isActive ? tool.color : undefined,
                    borderWidth: isActive ? '2px' : undefined,
                }}
            >
                {isActive && (
                    <div
                        className="absolute inset-0 opacity-[0.1] dark:opacity-[0.05] pointer-events-none"
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                45deg,
                ${tool.color},
                ${tool.color} 10px,
                transparent 10px,
                transparent 20px
              )`,
                        }}
                    />
                )}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                        <div
                            className={cn(
                                'relative z-10 flex items-center justify-center rounded-full border-3 transition-all duration-300',
                                isActive
                                    ? 'h-10 w-10 scale-110 border-white shadow-lg'
                                    : 'h-7 w-7 border-white/80 dark:border-gray-600',
                            )}
                            style={{
                                backgroundColor: tool.color,
                                borderWidth: isActive ? '3px' : '2px',
                            }}
                        >
                            <span
                                className={cn(
                                    'font-bold text-white',
                                    isActive ? 'text-sm' : 'text-xs',
                                )}
                            >
                                {tool.index}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <span
                                className={cn(
                                    'font-semibold transition-colors',
                                    isActive
                                        ? 'text-sm text-gray-900 dark:text-white'
                                        : 'text-xs text-gray-700 dark:text-gray-300',
                                )}
                            >
                                {tool.label || `Tool ${tool.toolNumber}`}
                            </span>
                            {tool.startLine && (
                                <span
                                    className={cn(
                                        'transition-colors whitespace-nowrap text-xs font-medium opacity-100',
                                    )}
                                    style={{ color: '#000' }}
                                >
                                    Line {tool.startLine}
                                    {tool.endLine && ` - ${tool.endLine}`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
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
