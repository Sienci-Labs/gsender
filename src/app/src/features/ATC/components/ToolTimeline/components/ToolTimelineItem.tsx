import cn from 'classnames';
import { ToolChange } from './types';
import Button from 'app/components/Button';
import { TbSwitch3 } from 'react-icons/tb';
import { useEffect, useState } from 'react';
import { lookupToolName } from 'app/features/ATC/utils/ATCFunctions.ts';
import pubsub from 'pubsub-js';
import Tooltip from 'app/components/Tooltip';
import { ToolProbeState } from 'app/features/ATC/types.ts';
import { ToolStatusBadges } from 'app/features/ATC/components/ui/ToolStatusBadges.tsx';

interface ToolTimelineItemProps {
    tool: ToolChange;
    isActive: boolean;
    isLast: boolean;
    progress: number;
    isRemapped: boolean;
    isManual?: boolean;
    remapValue?: number;
    probeState?: ToolProbeState;
    canRemap?: boolean;
    handleRemap?: (number) => void;
}

export function ToolTimelineItem({
    tool,
    isActive,
    isLast,
    handleRemap,
    isRemapped,
    isManual = false,
    remapValue,
    probeState = 'unprobed',
    canRemap = false,
}: ToolTimelineItemProps) {
    const [label, setLabel] = useState('');

    const hasNickname = label !== '-' && Boolean(label);
    const currentToolLabel = tool.label || `T${tool.toolNumber}`;
    const mappedToolLabel =
        remapValue !== undefined ? `T${remapValue}` : currentToolLabel;
    const lineRange = `${tool.startLine}${tool.endLine ? `-${tool.endLine}` : ''}`;

    useEffect(() => {
        const toolLookup = isRemapped ? remapValue : tool.toolNumber;
        setLabel(lookupToolName(toolLookup));
    }, [tool, isRemapped, remapValue]);

    useEffect(() => {
        const token = pubsub.subscribe('toolmap:updated', () => {
            const toolLookup = isRemapped ? remapValue : tool.toolNumber;
            setLabel(lookupToolName(toolLookup));
        });
        return () => {
            pubsub.unsubscribe(token);
        };
    }, [tool, isRemapped, remapValue]);

    return (
        <div className="flex flex-col items-center">
            <div
                className={cn(
                    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-colors border border-l-0 overflow-hidden',
                    isActive
                        ? 'bg-gray-50/80 border-2 dark:bg-gray-800/80'
                        : 'bg-gray-50/80 border-gray-200 dark:bg-gray-800/80 dark:border-gray-700 hover:bg-gray-100/80 dark:hover:bg-gray-800/80',
                )}
                style={{
                    borderColor: isActive ? tool.color : undefined,
                    boxShadow: isActive
                        ? `0 0 18px 2px ${tool.color}44`
                        : undefined,
                }}
            >
                <div
                    className="absolute left-0 top-0 h-full w-[3px] rounded-l-lg"
                    style={{ backgroundColor: tool.color }}
                />
                {isActive && (
                    <div
                        className="pointer-events-none absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `repeating-linear-gradient(135deg, ${tool.color}, ${tool.color} 6px, transparent 6px, transparent 14px)`,
                        }}
                    />
                )}
                <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                    style={{ backgroundColor: tool.color }}
                >
                    {tool.index}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-1.5 min-h-[1.25rem]">
                        {isRemapped ? (
                            <>
                                <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                                    {currentToolLabel}
                                </span>
                                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {mappedToolLabel}
                                </span>
                            </>
                        ) : (
                            <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {currentToolLabel}
                            </span>
                        )}
                        {hasNickname && (
                            <>
                                <span className="text-gray-500 dark:text-gray-400">
                                    ·
                                </span>
                                <Tooltip content={label} side="top">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {label}
                                    </span>
                                </Tooltip>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <ToolStatusBadges
                            probeState={probeState}
                            isManual={isManual}
                            size="sm"
                            manualPosition="after"
                            className="[&>div:first-child]:min-w-[124px]"
                        />
                    </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-3 self-stretch">
                    <span className="whitespace-nowrap font-mono text-xs text-gray-500 dark:text-gray-400">
                        {lineRange}
                    </span>
                    {canRemap && (
                        <Button
                            className="relative z-10 !h-full !w-11 self-stretch rounded-lg border border-gray-300/80 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600/70 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            onClick={handleRemap}
                            size="custom"
                        >
                            <TbSwitch3 size={32} />
                        </Button>
                    )}
                </div>
            </div>

            {!isLast && (
                <div className="h-4 w-px bg-gray-300/50 dark:bg-gray-600/50" />
            )}
        </div>
    );
}
