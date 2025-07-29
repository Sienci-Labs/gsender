import {ToolInstance, ToolStatus} from 'app/features/ATC/components/ToolTable.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { useEffect, useState } from 'react';
import { lookupSpecificTool } from 'app/features/ATC/utils/ATCFunctions.ts';
import {ToolNameInput} from "app/features/ATC/components/ToolNameInput.tsx";

interface ToolInfoWidgetProps {
    toolNumber: number;
    nickname?: string;
    zOffset: number;
    status: ToolStatus;
    onLoadTool?: () => void;
}

export function CurrentToolInfo({
    toolNumber = 1,
    nickname = 0,
    zOffset = 0,
    status = 'probed',
    onLoadTool,
}) {
    const [selectedTool, setSelectedTool] = useState<ToolInstance>({
        id: -1,
        nickname: '-',
        toolOffsets: {
            x: 0,
            y: 0,
            z: 0
        }, status: 'unprobed',
        toolRadius: 0
    });
    const currentTool = useTypedSelector(
        (state: RootState) => state.controller.state.status?.currentTool,
    );
    const toolTable = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
    );


    useEffect(() => {
        if (currentTool) {
            let populatedTool = lookupSpecificTool(currentTool, toolTable);
            console.log(currentTool);
            if (populatedTool) {
                console.log(populatedTool);
                setSelectedTool(populatedTool);
            }
        }
    }, [currentTool]);

    return (
        <div className={'w-3/5'}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-900">
                        {currentTool ? `T${currentTool}` : 'Empty'}
                    </h1>
                </div>

                {/* Conditional Load Button */}
                {status === 'Off-rack' && (
                    <button
                        onClick={onLoadTool}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
                    >
                        Load Tool {toolNumber} to Rack
                    </button>
                )}
            </div>

            {/* Table-style Information */}
            <div className="space-y-2">
                {/* Nickname Row */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-20">
                        Tool Name:
                    </span>
                    <ToolNameInput id={selectedTool?.id} nickname={selectedTool?.nickname} />
                </div>

                {/* Z Offset Row */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-20">
                        Tool Offset:
                    </span>
                    <div className="flex-1 border-2 border-robin-300 rounded-lg px-3 py-2 bg-robin-100">
                        <div className="flex items-center gap-3">
                            <span className="text-robin-900 font-medium">
                                {zOffset.toFixed(3)} mm
                            </span>
                            <button
                                className={`ml-auto px-3 py-1 rounded text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    status === 'Probed'
                                        ? 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500'
                                        : 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500'
                                }`}
                            >
                                Probe
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
