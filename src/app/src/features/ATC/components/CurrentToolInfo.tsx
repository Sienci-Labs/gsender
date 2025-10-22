import { ToolInstance } from 'app/features/ATC/components/ToolTable.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { useEffect, useState } from 'react';
import { lookupSpecificTool } from 'app/features/ATC/utils/ATCFunctions.ts';
import controller from 'app/lib/controller.ts';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { AlertTriangle, CheckCircle, Package, Wrench } from 'lucide-react';
import Button from 'app/components/Button';
import { PiEmpty } from 'react-icons/pi';
import { toolStateThemes } from 'app/features/ATC/utils/ATCiConstants.ts';

export function CurrentToolInfo({ status = 'probed', disabled }) {
    const { rackSize } = useToolChange();
    const [selectedTool, setSelectedTool] = useState<ToolInstance>({
        id: 1,
        nickname: '-',
        toolOffsets: {
            x: 0,
            y: 0,
            z: -2,
        },
        status: 'probed',
        toolRadius: 0,
    });

    /*const currentTool = useTypedSelector(
        (state: RootState) => state.controller.state.status?.currentTool,
    );*/

    const currentTool = 1;

    const toolTable = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
    );

    const probeTool = (id) => {
        if (id < 1) {
            return;
        }
        controller.command('gcode', [`G65P301Q${id}`, '$#']);
    };

    useEffect(() => {
        if (currentTool) {
            let populatedTool = lookupSpecificTool(
                currentTool,
                toolTable,
                rackSize,
            );
            if (populatedTool) {
                setSelectedTool(populatedTool);
            }
        }
    }, [currentTool]);

    const getWidgetState = () => {
        if (currentTool === 0) {
            return toolStateThemes.empty;
        }
        const state = toolStateThemes[selectedTool.status];
        if (state) {
            return state;
        }
        return toolStateThemes.error;
    };

    const state = getWidgetState();
    const formattedOffset =
        currentTool === 0 ? '-' : selectedTool.toolOffsets.z.toFixed(3);
    const BadgeIcon = state.icon;

    return (
        <div className={'w-4/5'}>
            <div
                className={`${state.backgroundColor} ${state.borderColor} bg-opacity-10 border rounded-lg p-2 transition-all duration-200`}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Wrench className={`${state.textColor} w-5 h-5`} />
                        <div className="flex flex-col">
                            <span
                                className={`${state.textColor} font-semibold text-lg`}
                            >
                                {currentTool === 0
                                    ? 'Empty'
                                    : `T${selectedTool.id}`}
                            </span>
                            {selectedTool.nickname && (
                                <span className="text-gray-600 text-xs">
                                    {selectedTool.nickname}
                                </span>
                            )}
                        </div>
                    </div>

                    <span
                        className={`${state.backgroundColor} ${state.borderColor} border-2 min-w-20 ${state.textColor} text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1`}
                    >
                        <BadgeIcon className="w-3 h-3" />
                        {state.label}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="w-32 bg-white rounded-lg px-2 py-1 shadow-inner border border-gray-200 pointer-events-none select-none">
                        <div
                            className={`${state.textColor} font-mono text-xl font-bold text-center`}
                        >
                            {formattedOffset}
                        </div>
                    </div>
                    <Button
                        onClick={() => probeTool(currentTool)}
                        disabled={currentTool === 0}
                        variant="primary"
                    >
                        Probe
                    </Button>
                </div>
            </div>
        </div>
    );
}
