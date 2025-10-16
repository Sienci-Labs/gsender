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

export function CurrentToolInfo({ status = 'probed', disabled }) {
    const { rackSize } = useToolChange();
    const [selectedTool, setSelectedTool] = useState<ToolInstance>({
        id: 0,
        nickname: '-',
        toolOffsets: {
            x: 0,
            y: 0,
            z: -2,
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
                badgeColor: 'bg-gray-200',
                showProbe: true,
                badge: 'Empty',
                badgeIcon: PiEmpty,
            };
        }

        if (selectedTool.toolOffsets.z === 0) {
            return {
                label: `T${currentTool}`,
                bgColor: 'bg-orange-100',
                borderColor: 'border-orange-400',
                textColor: 'text-orange-800',
                badgeColor: 'bg-orange-500',
                showProbe: true,
                badge: 'Unprobed',
                badgeIcon: AlertTriangle,
            };
        }

        if (currentTool > rackSize) {
            return {
                label: `T${currentTool}`,
                showProbe: true,
                badge: 'Off-Rack',
                bgColor: 'bg-yellow-100',
                borderColor: 'border-yellow-400',
                textColor: 'text-yellow-800',
                badgeColor: 'bg-yellow-500',
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
                className={`${state.bgColor} ${state.borderColor} bg-opacity-30 border rounded-lg p-2 transition-all duration-200`}
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
                                    {currentTool === 0 && '-'}
                                </span>
                            )}
                        </div>
                    </div>
                    {state.badge && BadgeIcon && (
                        <span
                            className={`${state.badgeColor} min-w-20 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1`}
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
                        <Button
                            onClick={() => probeTool(currentTool)}
                            disabled={currentTool === 0}
                            variant="primary"
                        >
                            Probe
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
