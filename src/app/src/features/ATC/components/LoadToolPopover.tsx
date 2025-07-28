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

const ToolChangerPopover: React.FC = ({ isOpen, setIsOpen, tools = [] }) => {
    const [selectedToolId, setSelectedToolId] = useState<string>('1');
    const [isLoading, setIsLoading] = useState(false);

    const selectedTool =
        tools.find((tool) => tool.id === selectedToolId) || tools[0];
    const currentStatus = selectedTool?.status || 'probed';

    const handleLoad = async () => {
        setIsLoading(true);
        // Simulate loading process
        controller.command('gcode', [`M6 T${selectedToolId}`]);
        setTimeout(() => {
            setIsLoading(false);
            setIsOpen(false);
        }, 700);
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

    const statusConfig = getStatusConfig(currentStatus);
    const StatusIcon = statusConfig.icon;

    console.log('load tools', tools);

    return (
        <Popover open={isOpen}>
            <PopoverTrigger asChild>
                <Button variant="primary" onClick={() => setIsOpen(!isOpen)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Load
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-6" align="end">
                <div className="space-y-2">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            Select Tool
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
                                <SelectContent className="w-full flex-1 bg-white">
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
