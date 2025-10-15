import {
    ToolInstance,
    ToolStatus,
} from 'app/features/ATC/components/ToolTable.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { useEffect, useState } from 'react';
import { lookupSpecificTool } from 'app/features/ATC/utils/ATCFunctions.ts';
import { ToolNameInput } from 'app/features/ATC/components/ToolNameInput.tsx';
import { Button } from 'app/components/Button';
import controller from 'app/lib/controller.ts';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { AlertTriangle, CheckCircle, Package, Wrench } from 'lucide-react';

export function CurrentToolInfo({ status = 'probed', disabled }) {
    const { rackSize } = useToolChange();
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

    //const currentTool = 0;

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
            return {
                label: 'Empty',
                bgColor: 'bg-gray-200',
                borderColor: 'border-gray-300',
                textColor: 'text-gray-600',
                showProbe: false,
            };
        }

        if (selectedTool.toolOffsets.z === 0) {
            return {
                label: `T${currentTool}`,
                bgColor: 'bg-yellow-100',
                borderColor: 'border-yellow-400',
                textColor: 'text-yellow-800',
                showProbe: true,
                badge: 'Unprobed',
                badgeColor: 'bg-yellow-500',
                badgeIcon: AlertTriangle,
            };
        }

        if (currentTool > rackSize) {
            return {
                label: `T${currentTool}`,
                bgColor: 'bg-orange-100',
                borderColor: 'border-orange-400',
                textColor: 'text-orange-800',
                showProbe: true,
                badge: 'Off-Rack',
                badgeColor: 'bg-orange-500',
                badgeIcon: Package,
            };
        }

        return {
            label: `T${currentTool}`,
            bgColor: 'bg-green-100',
            borderColor: 'border-green-400',
            textColor: 'text-green-800',
            showProbe: true,
            badge: 'Ready',
            badgeColor: 'bg-green-500',
            badgeIcon: CheckCircle,
        };
    };

    const state = getWidgetState();
    const formattedOffset =
        currentTool === 0 ? '-' : selectedTool.toolOffsets.z.toFixed(3);
    const BadgeIcon = state.badgeIcon;

    return (
        <div className={'w-4/5'}>
            <div
                className={`${state.bgColor} ${state.borderColor} border-2 rounded-lg p-4 shadow-md transition-all duration-200`}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Wrench className={`${state.textColor} w-5 h-5`} />
                        <div className="flex flex-col">
                            <span
                                className={`${state.textColor} font-semibold text-lg`}
                            >
                                {state.label}
                            </span>
                            {selectedTool.nickname && currentTool > 0 && (
                                <span className="text-gray-600 text-xs">
                                    {selectedTool.nickname}
                                </span>
                            )}
                        </div>
                    </div>
                    {state.badge && BadgeIcon && (
                        <span
                            className={`${state.badgeColor} text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1`}
                        >
                            <BadgeIcon className="w-3 h-3" />
                            {state.badge}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="w-32 bg-white rounded-lg px-2 py-1 shadow-inner border border-gray-200 pointer-events-none select-none">
                        <div
                            className={`${state.textColor} font-mono text-xl font-bold text-center`}
                        >
                            {formattedOffset}
                        </div>
                    </div>
                    {state.showProbe && (
                        <button
                            onClick={probeTool}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-150"
                        >
                            Probe
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
