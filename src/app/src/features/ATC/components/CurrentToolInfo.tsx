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

export function CurrentToolInfo({ disabled }: { disabled?: boolean }) {
    const { rackSize, connected } = useToolChange();
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
    const BadgeIcon = state.icon;

    return (
        <div className="w-full">
            <div
                className={`${state.backgroundColor} ${state.borderColor} bg-opacity-10 border rounded p-3 transition-all duration-200`}
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
                            {selectedTool.nickname && (
                                <span className="text-gray-600 text-xs">
                                    {selectedTool.nickname}
                                </span>
                            )}
                        </div>
                    </div>

                    <span
                        className={`${state.backgroundColor} ${state.borderColor} border-2 min-w-18 ${state.textColor} text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1`}
                    >
                        <BadgeIcon className="w-3 h-3" />
                        {state.label}
                    </span>
                </div>

                <div className="mt-2.5 grid grid-cols-[1fr_auto] items-center gap-3">
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
