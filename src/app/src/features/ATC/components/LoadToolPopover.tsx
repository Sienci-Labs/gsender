import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { cn } from 'app/lib/utils';
import {
    ToolInstance,
    ToolStatus,
} from 'app/features/ATC/components/ToolTable.tsx';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import {
    loadAndSaveToRack,
    loadTool,
    LoadToolMode,
    releaseToolFromSpindle,
    saveToRack,
} from 'app/features/ATC/utils/ATCFunctions.ts';
import { toolStateThemes } from 'app/features/ATC/utils/ATCiConstants.ts';
import { ToolStatusBadges } from 'app/features/ATC/components/ui/ToolStatusBadges.tsx';

interface ToolChangerPopoverProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    disabled?: boolean;
    tools?: ToolInstance[];
    trigger?: React.ReactNode;
    contentClassName?: string;
    contentAlign?: React.ComponentProps<typeof PopoverContent>['align'];
    contentAlignOffset?: React.ComponentProps<typeof PopoverContent>['alignOffset'];
    contentSide?: React.ComponentProps<typeof PopoverContent>['side'];
    contentSideOffset?: React.ComponentProps<typeof PopoverContent>['sideOffset'];
}

const ToolChangerPopover: React.FC<ToolChangerPopoverProps> = ({
    isOpen,
    setIsOpen,
    disabled,
    tools = [],
    trigger,
    contentClassName,
    contentAlign,
    contentAlignOffset,
    contentSide,
    contentSideOffset,
}) => {
    const { mode, rackSize, connected, atcAvailable } = useToolChange();
    const [selectedToolId, setSelectedToolId] = useState<string>('1');
    const [isLoading, setIsLoading] = useState(false);

    const selectedTool =
        tools.find((tool) => tool.id === selectedToolId) || tools[0];
    const currentStatus = selectedTool?.status || 'probed';
    const allowManualBadge = connected && atcAvailable;
    const isManual = allowManualBadge
        ? selectedTool
            ? selectedTool.isManual ?? selectedTool.id > rackSize
            : false
        : false;

    const handleLoad = async () => {
        setIsLoading(true);
        // Three different codes based on what the user wants to do
        switch (mode) {
            case 'load':
                loadTool(selectedToolId);
                break;
            case 'manual':
                loadAndSaveToRack(selectedToolId);
                break;
            case 'unload':
                releaseToolFromSpindle();
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

    const getStatusConfig = (status: ToolStatus) => {
        const styling = toolStateThemes[status];
        switch (status) {
            case 'probed':
                return {
                    ...styling,
                    title: 'Probed',
                    description: 'Offset found for selected tool.',
                };
            case 'unprobed':
                return {
                    ...styling,
                    title: 'Unprobed Tool',
                    description: 'Offset not found for selected tool.',
                };
        }
    };

    const getModeTitle = (tcMode: LoadToolMode) => {
        switch (tcMode) {
            case 'load':
                return 'Load Tool';
            case 'manual':
                return 'Manual Load Tool';
            case 'unload':
                return 'Unload Tool Manually';
            case 'loadAndSave':
                return 'Load and Save Tool';
        }
    };

    const statusConfig = getStatusConfig(currentStatus);
    const StatusIcon = statusConfig.icon;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            {trigger ? <PopoverTrigger asChild>{trigger}</PopoverTrigger> : null}
            <PopoverContent
                className={cn('w-96 p-6', contentClassName)}
                align={contentAlign ?? 'end'}
                alignOffset={contentAlignOffset}
                side={contentSide}
                sideOffset={contentSideOffset}
            >
                <div className="space-y-2">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                            {getModeTitle(mode)}
                        </h3>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <Select
                                value={selectedToolId}
                                onValueChange={setSelectedToolId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue>
                                        <div className="flex items-center gap-2 w-full min-w-0">
                                            <span className="font-mono font-semibold text-slate-800 dark:text-white shrink-0">
                                                {selectedTool?.id}
                                            </span>
                                            {selectedTool?.nickname && (
                                                <span className="text-slate-600 dark:text-white text-sm truncate flex-1 min-w-0">
                                                    {selectedTool.nickname}
                                                </span>
                                            )}
                                            {selectedTool && (
                                                <ToolStatusBadges
                                                    probeState={currentStatus}
                                                    isManual={isManual}
                                                    size="sm"
                                                    showLabel={false}
                                                    className="ml-auto shrink-0"
                                                />
                                            )}
                                        </div>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="w-full flex-1 bg-white z-[10000]">
                                    {tools.map((tool) => {
                                        const toolIsManual = allowManualBadge
                                            ? tool.isManual ??
                                              tool.id > rackSize
                                            : false;
                                        return (
                                            <SelectItem
                                                key={tool.id}
                                                value={tool.id}
                                            >
                                                <div className="flex items-center gap-2 min-w-0 w-full">
                                                    <span className="font-mono font-semibold text-slate-800 dark:text-white shrink-0">
                                                        {tool?.id}
                                                    </span>
                                                    {tool?.nickname && (
                                                        <span className="text-slate-600 dark:text-white text-sm truncate flex-1 min-w-0">
                                                            {tool.nickname}
                                                        </span>
                                                    )}
                                                    <ToolStatusBadges
                                                        probeState={tool.status}
                                                        isManual={toolIsManual}
                                                        size="sm"
                                                        showLabel={false}
                                                        className="ml-auto shrink-0"
                                                    />
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleLoad}
                            disabled={disabled || isLoading}
                            variant="primary"
                            className="shrink-0"
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
                        className={`rounded-lg p-4 border ${statusConfig.backgroundColor} ${statusConfig.borderColor}`}
                    >
                        <div className="flex items-start gap-3">
                            <StatusIcon
                                className={`w-5 h-5 ${statusConfig.textColor} mt-0.5 flex-shrink-0`}
                            />
                            <div className="flex-1 min-w-0">
                                <h4
                                    className={`font-semibold ${statusConfig.textColor} text-sm`}
                                >
                                    {statusConfig.title}
                                </h4>
                                <p
                                    className={`text-sm ${statusConfig.textColor} mt-1 leading-relaxed`}
                                >
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
