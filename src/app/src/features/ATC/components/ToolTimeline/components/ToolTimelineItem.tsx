import cn from 'classnames';
import { ToolChange } from './types';
import Button from 'app/components/Button';
import { TbSwitch3 } from 'react-icons/tb';
import { ArrowRight } from 'lucide-react';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { useEffect, useState } from 'react';
import { lookupToolName } from 'app/features/ATC/utils/ATCFunctions.ts';

interface ToolTimelineItemProps {
    tool: ToolChange;
    isActive: boolean;
    isLast: boolean;
    progress: number;
    isRemapped: boolean;
    remapValue?: number;
    handleRemap?: (number) => void;
}

export function ToolTimelineItem({
    tool,
    isActive,
    isLast,
    handleRemap,
    isRemapped,
    remapValue,
}: ToolTimelineItemProps) {
    const [label, setLabel] = useState('');

    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    useEffect(() => {
        const toolLookup = isRemapped ? remapValue : tool.toolNumber;
        setLabel(lookupToolName(toolLookup));
    }, [tool, isRemapped, remapValue]);

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
                            <div
                                className={cn(
                                    'font-semibold transition-colors flex flex-row gap-1 items-center flex flex-col',
                                    isActive
                                        ? 'text-sm text-gray-900 dark:text-white'
                                        : 'text-xs text-gray-700 dark:text-gray-300',
                                )}
                            >
                                <div className="flex flex-row gap-2 items-center justify-start">
                                    <span
                                        className={cn(
                                            isRemapped && 'line-through',
                                            'flex flex-col',
                                        )}
                                    >
                                        {tool.label || `T${tool.toolNumber}`}
                                    </span>
                                    {isRemapped && (
                                        <>
                                            <ArrowRight />
                                            <span className="no-underline">
                                                T{remapValue}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div>
                                    {label !== '-' && (
                                        <span className="text-xs text-gray-500">
                                            {label}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span
                                    className={cn(
                                        'transition-colors whitespace-nowrap text-xs font-medium opacity-100 text-black dark:text-white',
                                    )}
                                >
                                    Line {tool.startLine}
                                    {tool.endLine && ` - ${tool.endLine}`}
                                </span>
                                {isConnected && (
                                    <Button
                                        className="!w-auto"
                                        onClick={handleRemap}
                                        size="xs"
                                    >
                                        <TbSwitch3 />
                                    </Button>
                                )}
                            </div>
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
