import React, { useState } from 'react';
import {
    Settings,
    Search,
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

interface Tool {
    id: string;
    number: string;
    identifier?: string;
    status: 'probed' | 'unprobed' | 'offrack';
}

const tools: Tool[] = [
    { id: '1', number: 'T1', identifier: '1/4" End Mill', status: 'probed' },
    { id: '2', number: 'T2', identifier: '1/8" Drill', status: 'unprobed' },
    { id: '3', number: 'T3', identifier: '3/8" Face Mill', status: 'probed' },
    { id: '4', number: 'T4', identifier: '1/2" Ball End', status: 'offrack' },
    { id: '5', number: 'T5', identifier: '', status: 'unprobed' },
    { id: '6', number: 'T6', identifier: 'Spot Drill', status: 'probed' },
];

const ToolChangerPopover: React.FC = () => {
    const [selectedToolId, setSelectedToolId] = useState<string>(tools[0].id);
    const [isProbing, setIsProbing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toolStatuses, setToolStatuses] = useState<
        Record<string, Tool['status']>
    >(tools.reduce((acc, tool) => ({ ...acc, [tool.id]: tool.status }), {}));

    const selectedTool =
        tools.find((tool) => tool.id === selectedToolId) || tools[0];
    const currentStatus = toolStatuses[selectedToolId] || selectedTool.status;

    const handleProbe = async () => {
        if (currentStatus === 'probed') return;

        setIsProbing(true);
        // Simulate probing process
        setTimeout(() => {
            setToolStatuses((prev) => ({
                ...prev,
                [selectedToolId]: 'probed',
            }));
            setIsProbing(false);
        }, 2000);
    };

    const handleLoad = async () => {
        setIsLoading(true);
        // Simulate loading process
        setTimeout(() => {
            setIsLoading(false);
        }, 700);
    };

    const getStatusConfig = (status: Tool['status']) => {
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

    const statusConfig = getStatusConfig(currentStatus);
    const StatusIcon = statusConfig.icon;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="primary">
                    <Settings className="w-4 h-4 mr-2" />
                    Load
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-6" align="end">
                <div className="space-y-2">
                    {/* Header */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            Select Tool
                        </h3>
                    </div>

                    {/* Tool Selection and Actions */}
                    <div className="flex items-center gap-3">
                        {/* Tool Select */}
                        <div className="flex-1">
                            <Select
                                value={selectedToolId}
                                onValueChange={setSelectedToolId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-semibold text-slate-800">
                                                {selectedTool.number}
                                            </span>
                                            {selectedTool.identifier && (
                                                <span className="text-slate-600 text-sm truncate">
                                                    {selectedTool.identifier}
                                                </span>
                                            )}
                                        </div>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {tools.map((tool) => (
                                        <SelectItem
                                            key={tool.id}
                                            value={tool.id}
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <span className="font-mono font-semibold text-slate-800 min-w-[2rem]">
                                                    {tool.number}
                                                </span>
                                                {tool.identifier && (
                                                    <span className="text-slate-600 text-sm truncate">
                                                        {tool.identifier}
                                                    </span>
                                                )}
                                                <div className="ml-auto">
                                                    {toolStatuses[tool.id] ===
                                                        'probed' && (
                                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                                    )}
                                                    {toolStatuses[tool.id] ===
                                                        'unprobed' && (
                                                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                                                    )}
                                                    {toolStatuses[tool.id] ===
                                                        'offrack' && (
                                                        <AlertCircle className="w-3 h-3 text-orange-600" />
                                                    )}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Load Button */}
                        <Button
                            onClick={handleLoad}
                            disabled={isLoading || currentStatus === 'offrack'}
                            variant="primary"
                            className={`${
                                currentStatus === 'offrack'
                                    ? 'bg-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-400 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-700'
                            }`}
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

                    {/* Status Indicator */}
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
