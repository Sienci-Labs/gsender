import React, { useState } from 'react';
import {
    Settings,
    Loader2,
    CheckCircle,
    AlertTriangle,
    AlertCircle,
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover.tsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select.tsx';
import { Button } from 'app/components/Button';
import controller from 'app/lib/controller.ts';
import {
    ToolInstance,
    ToolStatus,
} from 'app/features/ATC/components/ToolTable.tsx';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import {
    loadAndSaveToRack,
    loadTool,
    LoadToolMode,
    saveToRack,
} from 'app/features/ATC/utils/ATCFunctions.ts';

const ToolChangerPopover: React.FC = ({
    isOpen,
    setIsOpen,
    disabled,
    tools = [],
}) => {
    const { mode, setLoadToolMode } = useToolChange();
    const [selectedToolId, setSelectedToolId] = useState<string>('1');
    const [isLoading, setIsLoading] = useState(false);

    const selectedTool =
        tools.find((tool) => tool.id === selectedToolId) || tools[0];
    const currentStatus = selectedTool?.status || 'probed';

    const handleLoad = async () => {
        setIsLoading(true);
        // Three different codes based on what the user wants to do
        switch (mode) {
            case 'load':
                loadTool(selectedToolId);
                break;
            case 'save':
                saveToRack(selectedToolId);
                break;
            case 'loadAndSave':
                loadAndSaveToRack(selectedToolId);
        }
        // Simulate loading process
        setTimeout(() => {
            setIsLoading(false);
            setIsOpen(false);
        }, 700);
    };

    const handleLoadOpen = () => {
        setLoadToolMode('load');
        setIsOpen(true);
    };

    const getStatusConfig = (status: ToolStatus) => {
        switch (status) {
            case 'probed':
                return {
                    icon: CheckCircle,
                    title: 'Probed',
                    description: 'Offset found for selected tool.',
                    bgColor: 'bg-green-50/50',
                    iconColor: 'text-green-600',
                    titleColor: 'text-green-800',
                    borderColor: 'border-green-200',
                };
            case 'unprobed':
                return {
                    icon: AlertTriangle,
                    title: 'Offset not found',
                    description: 'Ensure tool is in rack before proceeding.',
                    bgColor: 'bg-amber-100',
                    iconColor: 'text-amber-600',
                    titleColor: 'text-amber-800',
                    borderColor: 'border-amber-200',
                };
            case 'offrack':
                return {
                    icon: AlertCircle,
                    title: 'Off Rack',
                    description: 'Tool not in tool changer.',
                    bgColor: 'bg-orange-50',
                    iconColor: 'text-orange-600',
                    titleColor: 'text-orange-800',
                    borderColor: 'border-orange-200',
                };
        }
    };

    const getModeTitle = (tcMode: LoadToolMode) => {
        switch (tcMode) {
            case 'load':
                return 'Load Tool';
            case 'save':
                return 'Save Tool';
            case 'loadAndSave':
                return 'Load and Save Tool';
        }
    };

    const statusConfig = getStatusConfig(currentStatus);
    const StatusIcon = statusConfig.icon;

    return (
        <Popover open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
            <PopoverTrigger asChild>
                <Button
                    disabled={disabled}
                    variant="primary"
                    onClick={handleLoadOpen}
                >
                    <Settings className="w-4 h-4 mr-2" />
                    Load
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-6" align="end">
                <div className="space-y-2">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            {getModeTitle(mode)}
                        </h3>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <Select
                                value={selectedToolId}
                                onValueChange={setSelectedToolId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-semibold text-slate-800">
                                                {selectedTool?.id}
                                            </span>
                                            {selectedTool?.nickname && (
                                                <span className="text-slate-600 text-sm truncate">
                                                    {selectedTool.nickname}
                                                </span>
                                            )}
                                        </div>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="w-full flex-1 bg-white z-[10000]">
                                    {tools.map((tool) => (
                                        <SelectItem
                                            key={tool.id}
                                            value={tool.id}
                                        >
                                            <div className="flex items-center gap-1 min-w-0">
                                                <span className="font-mono font-semibold text-slate-800 shrink-0">
                                                    {tool?.id}
                                                </span>
                                                {tool?.nickname && (
                                                    <span className="text-slate-600 text-sm truncate">
                                                        {tool.nickname}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-none">
                                                {tool?.status === 'probed' && (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                )}
                                                {tool?.status ===
                                                    'unprobed' && (
                                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                )}
                                                {tool?.status === 'offrack' && (
                                                    <AlertCircle className="w-4 h-4 text-orange-600" />
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleLoad}
                            disabled={isLoading}
                            variant="primary"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                'Load'
                            )}
                        </Button>
                    </div>
                    <div
                        className={`rounded-lg p-4 border ${statusConfig.bgColor} ${statusConfig.borderColor}`}
                    >
                        <div className="flex items-start gap-3">
                            <StatusIcon
                                className={`w-5 h-5 ${statusConfig.iconColor} mt-0.5 flex-shrink-0`}
                            />
                            <div className="flex-1 min-w-0">
                                <h4
                                    className={`font-semibold ${statusConfig.titleColor} text-sm`}
                                >
                                    {statusConfig.title}
                                </h4>
                                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                    {statusConfig.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default ToolChangerPopover;
