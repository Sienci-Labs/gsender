import { ChevronDown, ChevronUp } from 'lucide-react';
import cn from 'classnames';
import { Button } from 'app/components/Button';
import { ToolTimelineItem } from './ToolTimelineItem';
import { ToolMapping, ToolTimelineProps } from './types';
import { useEffect, useRef, useState } from 'react';
import { ToolRemapDialog } from 'app/features/ATC/components/ToolTimeline/components/ToolRemapDialog.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { mapToolNicknamesAndStatus } from 'app/features/ATC/utils/ATCFunctions.ts';
import { ToolInstance } from 'app/features/ATC/components/ToolTable.tsx';
import { updateToolchangeContext } from 'app/features/Helper/Wizard.tsx';
import pubsub from 'pubsub-js';
import get from 'lodash/get';
import { ToolProbeState } from 'app/features/ATC/types.ts';

export function ToolTimeline({
    tools,
    activeToolIndex,
    progress,
    onToggle,
    isCollapsed = false,
}: ToolTimelineProps) {
    const activeTool = tools[activeToolIndex];
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

    // Tool Remapping
    const [mappings, setMappings] = useState<ToolMapping>(new Map());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<number>(
        tools[0].toolNumber,
    );

    // Tool Table
    const [toolTable, setToolTable] = useState<ToolInstance[]>([]);
    const toolTableData = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
    );
    const settings = useTypedSelector(
        (state: RootState) => state.controller.settings,
    );
    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const reportedRackSize = Number(get(settings, 'atci.rack_size', -1));
    const atcAvailable = get(settings, 'info.NEWOPT.ATC', '0') === '1';
    const allowManualBadge = isConnected && atcAvailable;
    const rackSize =
        reportedRackSize > 0
            ? reportedRackSize
            : Object.values(toolTableData || {}).length;
    useEffect(() => {
        setToolTable(mapToolNicknamesAndStatus(toolTableData, rackSize));
    }, [toolTableData, rackSize]);

    useEffect(() => {
        const token = pubsub.subscribe('toolmap:updated', () => {
            setToolTable(mapToolNicknamesAndStatus(toolTableData, rackSize));
        });
        return () => {
            pubsub.unsubscribe(token);
        };
    }, [toolTableData, rackSize]);

    useEffect(() => {
        pubsub.subscribe('file:load', () => {
            setMappings(new Map());
            updateToolchangeContext(new Map());
        });
        return () => {
            pubsub.unsubscribe('file:loaded');
        };
    }, []);

    const handleRemapClick = (toolNumber: number) => {
        setSelectedTool(toolNumber);
        setDialogOpen(true);
    };

    const handleConfirmRemap = (fromTool: number, toTool: number) => {
        setMappings((prev) => {
            const newMappings = new Map(prev);
            if (fromTool === toTool) {
                newMappings.delete(fromTool);
            } else {
                newMappings.set(fromTool, toTool);
            }
            updateToolchangeContext(newMappings);
            return newMappings;
        });
    };

    useEffect(() => {
        if (isCollapsed) {
            return;
        }
        const activeItem = itemRefs.current[activeToolIndex];
        if (!activeItem) {
            return;
        }
        activeItem.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
        });
    }, [activeToolIndex, isCollapsed]);

    return (
        <div
            className={cn('bg-gray-500 bg-opacity-70 rounded-xl', {
                'w-[27rem]': !isCollapsed,
            })}
        >
            <div className="shadow-xl p-0.5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 pl-1">
                        {isCollapsed && activeTool && (
                            <>
                                <div
                                    className="h-6 w-6 rounded-md border-2 border-white shadow-sm"
                                    style={{ backgroundColor: activeTool.color }}
                                />
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    T{activeTool.toolNumber}
                                </span>
                            </>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className="h-7 w-7 rounded-lg hover:bg-white/50 text-gray-900 dark:hover:bg-gray-800/50"
                    >
                        {isCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {!isCollapsed && (
                    <div className="mt-2 relative">
                        <div
                            ref={scrollContainerRef}
                            className="max-h-[18.5rem] overflow-y-auto overflow-x-hidden scroll-smooth no-scrollbar px-2 py-1"
                        >
                            <ToolRemapDialog
                                open={dialogOpen}
                                onOpenChange={setDialogOpen}
                                originalTool={selectedTool}
                                allTools={toolTable}
                                onConfirm={handleConfirmRemap}
                            />
                            {tools.map((tool, index) => {
                                const isRemapped = mappings.has(
                                    tool.toolNumber,
                                );
                                const remapValue = mappings.get(
                                    tool.toolNumber,
                                );
                                const toolLookupNumber =
                                    isRemapped && remapValue !== undefined
                                        ? remapValue
                                        : tool.toolNumber;
                                const toolInfo = toolTable.find(
                                    (entry) => entry.id === toolLookupNumber,
                                );
                                const probeState: ToolProbeState =
                                    toolInfo?.status ?? 'unprobed';
                                const isManual = allowManualBadge
                                    ? toolInfo?.isManual ??
                                      (rackSize > 0
                                          ? toolLookupNumber > rackSize
                                          : false)
                                    : false;
                                return (
                                    <div
                                        key={tool.id}
                                        ref={(el) => {
                                            itemRefs.current[index] = el;
                                        }}
                                    >
                                        <ToolTimelineItem
                                            tool={tool}
                                            isActive={index === activeToolIndex}
                                            isLast={index === tools.length - 1}
                                            progress={
                                                index === activeToolIndex
                                                    ? progress
                                                    : 0
                                            }
                                            handleRemap={() =>
                                                handleRemapClick(tool.toolNumber)
                                            }
                                            isRemapped={isRemapped}
                                            remapValue={remapValue}
                                            isManual={isManual}
                                            probeState={probeState}
                                            canRemap={allowManualBadge}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
