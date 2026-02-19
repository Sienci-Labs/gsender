import { ToolInstance } from 'app/features/ATC/components/ToolTable.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { useEffect, useState } from 'react';
import { lookupSpecificTool } from 'app/features/ATC/utils/ATCFunctions.ts';
import controller from 'app/lib/controller.ts';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { Wrench } from 'lucide-react';
import Button from 'app/components/Button';
import { toolStateThemes } from 'app/features/ATC/utils/ATCiConstants.ts';
import pubsub from 'pubsub-js';
import { ToolStatusBadges } from 'app/features/ATC/components/ui/ToolStatusBadges.tsx';
import { Badge } from 'app/features/ATC/components/ui/Badge.tsx';

export function CurrentToolInfo({ disabled }: { disabled?: boolean }) {
    const { rackSize, connected, atcAvailable } = useToolChange();
    const [spindleTool, setSpindleTool] = useState(0);
    const [toolMapVersion, setToolMapVersion] = useState(0);
    const [selectedTool, setSelectedTool] = useState<ToolInstance>({
        id: 0,
        nickname: '-',
        toolOffsets: {
            x: 0,
            y: 0,
            z: 0,
        },
        status: 'unprobed',
        toolRadius: 0,
    });

    const currentTool = useTypedSelector(
        (state: RootState) => state.controller.state.status?.currentTool,
    );

    //const currentTool = 1;

    useEffect(() => {
        if (currentTool !== undefined && currentTool !== null) {
            setSpindleTool(currentTool);
        }
    }, [currentTool]);

    const toolTable = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
    );

    const probeTool = (id) => {
        if (id < 1) {
            return;
        }
        controller.command('gcode', [`G65P301Q${id}`, '$#']);
    };

    const isEmptyTool =
        currentTool === undefined || currentTool === null || currentTool <= 0;

    useEffect(() => {
        if (!isEmptyTool) {
            const populatedTool = lookupSpecificTool(
                spindleTool,
                toolTable,
                rackSize,
            );
            if (populatedTool) {
                setSelectedTool(populatedTool);
            }
        }
    }, [
        spindleTool,
        toolTable,
        connected,
        rackSize,
        toolMapVersion,
        isEmptyTool,
    ]);

    useEffect(() => {
        const token = pubsub.subscribe('toolmap:updated', () => {
            setToolMapVersion((prev) => prev + 1);
        });
        return () => {
            pubsub.unsubscribe(token);
        };
    }, []);

    const getWidgetState = () => {
        if (isEmptyTool) {
            return toolStateThemes.empty;
        }
        const state = toolStateThemes[selectedTool.status];
        if (state) {
            return state;
        }
        return toolStateThemes.error;
    };

    const state = getWidgetState();
    const formattedOffset = isEmptyTool
        ? '-'
        : selectedTool.toolOffsets.z.toFixed(3);
    const allowManualBadge = connected && atcAvailable;
    const isManualTool =
        !isEmptyTool &&
        (selectedTool.isManual ?? selectedTool.id > rackSize);
    const EmptyIcon = state.icon;
    const isRackTool = !isEmptyTool && selectedTool.id <= rackSize;

    return (
        <div className="w-full h-full flex-1">
            <div
                className={`${state.backgroundColor} ${state.borderColor} bg-opacity-10 border rounded p-3 transition-all duration-200 h-full flex flex-col justify-between`}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg border border-gray-200 bg-white/80 flex items-center justify-center">
                            <Wrench className={`${state.textColor} w-5 h-5`} />
                        </div>
                        <div className="flex flex-col">
                            <span
                                className={`${state.textColor} font-semibold text-base`}
                            >
                                {isEmptyTool ? 'Empty' : `T${selectedTool.id}`}
                            </span>
                            {!isEmptyTool && isRackTool && (
                                <span className="text-gray-600 text-xs">
                                    Rack
                                </span>
                            )}
                            {!isEmptyTool && !isRackTool && allowManualBadge && (
                                <span className="text-gray-600 text-xs">
                                    Manual
                                </span>
                            )}
                        </div>
                    </div>

                    {isEmptyTool ? (
                        <Badge
                            className={`${state.backgroundColor} ${state.borderColor} border-2 min-w-18 ${state.textColor} text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1`}
                        >
                            <EmptyIcon size={12} />
                            {state.label}
                        </Badge>
                    ) : (
                        <ToolStatusBadges
                            probeState={selectedTool.status}
                            isManual={isManualTool && allowManualBadge}
                            size="sm"
                        />
                    )}
                </div>

                <div className="text-left text-sm font-bold text-gray-700">
                    {isEmptyTool ? '' : selectedTool.nickname ?? ''}
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <div className="rounded-lg px-2 py-1 border border-gray-200 bg-white shadow-inner pointer-events-none select-none">
                        <div
                            className={`${state.textColor} font-mono text-lg font-bold text-center`}
                        >
                            {formattedOffset}
                        </div>
                    </div>
                    <Button
                        onClick={() => probeTool(currentTool)}
                        disabled={disabled || isEmptyTool}
                        variant="primary"
                        size="custom"
                        className="h-9 px-4 text-sm"
                    >
                        Probe
                    </Button>
                </div>
            </div>
        </div>
    );
}
