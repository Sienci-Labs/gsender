import { ChevronDown, ChevronsDown, ChevronsUp, ChevronUp } from 'lucide-react';
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
import {updateToolchangeContext} from "app/features/Helper/Wizard.tsx";
import pubsub from "pubsub-js";

export function ToolTimeline({
    tools,
    activeToolIndex,
    progress,
    onToggle,
    isCollapsed = false,
}: ToolTimelineProps) {
    const activeTool = tools[activeToolIndex];
    // Scroll hijacking
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollIndex, setScrollIndex] = useState(0);
    const maxVisibleTools = 4;
    const hasMoreTools = tools.length > maxVisibleTools;
    const canScrollUp = scrollIndex > 0;
    const canScrollDown = scrollIndex < tools.length - maxVisibleTools;

    // Tool Remapping
    const [mappings, setMappings] = useState<ToolMapping>(new Map());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<number>(
        tools[0].toolNumber,
    );

    // Tool Table
    const [toolTable, setToolTable] = useState<ToolInstance[]>([]);
    const [rackSize, setRackSize] = useState<number>(4);
    const toolTableData = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
    );
    useEffect(() => {
        setToolTable(mapToolNicknamesAndStatus(toolTableData, rackSize));
    }, [toolTableData, rackSize]);

    // File tools
    const [fileTools, setFileTools] = useState<Number[]>([]);
    const fileToolSet = useTypedSelector(
        (state: RootState) => state.file.toolSet,
    );
    useEffect(() => {
        const fileToolNumbers = fileToolSet.map((tool) => {
            return Number(tool.replace('T', ''));
        });
        setFileTools(fileToolNumbers);
    }, [fileToolSet]);

    useEffect(() => {
        pubsub.subscribe('file:load', () => {
            setMappings(new Map());
        })
        return () => {
            pubsub.unsubscribe('file:loaded');
        }
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
            console.log('New mappings:', newMappings);
            updateToolchangeContext(newMappings)
            return newMappings;
        });
    };

    useEffect(() => {
        if (activeToolIndex < scrollIndex) {
            setScrollIndex(activeToolIndex);
        } else if (activeToolIndex >= scrollIndex + maxVisibleTools) {
            setScrollIndex(activeToolIndex - maxVisibleTools + 1);
        }
    }, [activeToolIndex, isCollapsed]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            if (e.deltaY > 0 && canScrollDown) {
                setScrollIndex((prev) =>
                    Math.min(prev + 1, tools.length - maxVisibleTools),
                );
            } else if (e.deltaY < 0 && canScrollUp) {
                setScrollIndex((prev) => Math.max(prev - 1, 0));
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [canScrollUp, canScrollDown, tools.length, isCollapsed]);

    const visibleTools = tools.slice(
        scrollIndex,
        scrollIndex + maxVisibleTools,
    );

    return (
        <div
            className={cn('max-w-xs bg-gray-500 bg-opacity-70 rounded-xl', {
                'w-80': !isCollapsed,
            })}
        >
            <div className={cn('shadow-xl', isCollapsed ? 'p-2' : 'p-4')}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {isCollapsed && activeTool && (
                            <div
                                className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: activeTool.color }}
                            />
                        )}
                        <h3 className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                            {isCollapsed
                                ? `T${activeTool?.toolNumber || 0}`
                                : 'Tool Timeline'}
                        </h3>
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
                    <div className="mt-4 relative">
                        {hasMoreTools && canScrollUp && (
                            <div className="absolute top-0 left-0 right-0 h-8  flex items-start justify-center pt-1 z-10 rounded-t-lg">
                                <ChevronsUp className="h-4 w-4 text-gray-600 dark:text-gray-400 animate-bounce" />
                            </div>
                        )}

                        <div
                            ref={scrollContainerRef}
                            className="overflow-hidden px-2 py-1"
                            style={{
                                cursor: hasMoreTools ? 'ns-resize' : 'default',
                            }}
                        >
                            <ToolRemapDialog
                                open={dialogOpen}
                                onOpenChange={setDialogOpen}
                                originalTool={selectedTool}
                                allTools={toolTable}
                                passedTools={fileTools}
                                existingMappings={mappings}
                                onConfirm={handleConfirmRemap}
                            />
                            {visibleTools.map((tool, index) => {
                                const actualIndex = scrollIndex + index;
                                const isRemapped = mappings.has(
                                    tool.toolNumber,
                                );
                                const remapValue = mappings.get(
                                    tool.toolNumber,
                                );
                                return (
                                    <ToolTimelineItem
                                        key={tool.id}
                                        tool={tool}
                                        isActive={
                                            actualIndex === activeToolIndex
                                        }
                                        isLast={
                                            index === visibleTools.length - 1
                                        }
                                        progress={
                                            actualIndex === activeToolIndex
                                                ? progress
                                                : 0
                                        }
                                        handleRemap={() =>
                                            handleRemapClick(tool.toolNumber)
                                        }
                                        isRemapped={isRemapped}
                                        remapValue={remapValue}
                                    />
                                );
                            })}
                        </div>

                        {hasMoreTools && canScrollDown && (
                            <div className="absolute bottom-0 left-0 right-0 h-8  flex items-end justify-center pb-1 z-10 rounded-b-lg">
                                <ChevronsDown className="h-4 w-4 text-gray-600 dark:text-gray-400 animate-bounce" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
