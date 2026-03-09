import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import * as SelectPrimitive from '@radix-ui/react-select';
import {
    Select,
    SelectContent,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select';
import { Button } from 'app/components/Button';
import { Label } from 'app/components/shadcn/Label';
import { Badge } from 'app/components/shadcn/Badge';
import {
    ArrowRight,
} from 'lucide-react';
import cn from 'classnames';
import { ToolInstance } from 'app/features/ATC/components/ToolTable.tsx';
import {
    toolStateThemes,
} from 'app/features/ATC/utils/ATCiConstants.ts';
import { ToolStatusBadges } from 'app/features/ATC/components/ui/ToolStatusBadges.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import get from 'lodash/get';

interface ToolRemapDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    originalTool: Number;
    allTools: ToolInstance[];
    onConfirm: (fromTool: number, toTool: number) => void;
}

export function ToolRemapDialog({
    open,
    onOpenChange,
    originalTool,
    allTools,
    onConfirm,
}: ToolRemapDialogProps) {
    const [selectedTool, setSelectedTool] = useState<string>('');
    const [currentTool, setCurrentTool] = useState<ToolInstance | undefined>(
        undefined,
    );
    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const settings = useTypedSelector(
        (state: RootState) => state.controller.settings,
    );
    const atcAvailable = get(settings, 'info.NEWOPT.ATC', '0') === '1';
    const allowManualBadge = isConnected && atcAvailable;

    const handleConfirm = () => {
        if (selectedTool) {
            const toTool = parseInt(selectedTool);
            onConfirm(originalTool, toTool);
            setSelectedTool('');
            onOpenChange(false);
        }
    };

    const handleCancel = () => {
        setSelectedTool('');
        onOpenChange(false);
    };

    const isToolAvailable = (toolNumber: number): boolean => {
        if (toolNumber === originalTool) return true;

        return true;
    };

    const getToolInfo = (toolNumber: number): ToolInstance | undefined => {
        return allTools.find((t) => t.id === toolNumber);
    };

    const selectedToolNumber = selectedTool ? parseInt(selectedTool) : undefined;
    const selectedToolInfo = selectedToolNumber
        ? getToolInfo(selectedToolNumber)
        : undefined;

    const formatToolLabel = (
        tool: ToolInstance | undefined,
        fallbackId?: number,
    ) => {
        if (!tool) return fallbackId ? `T${fallbackId}` : '';
        const nickname = tool.nickname && tool.nickname !== '-' ? tool.nickname : '';
        return nickname ? `T${tool.id} - ${nickname}` : `T${tool.id}`;
    };

    const formatToolNumber = (toolNumber?: number) => {
        return toolNumber ? `T${toolNumber}` : '';
    };

    useEffect(() => {
        const tool = getToolInfo(originalTool);
        setCurrentTool(tool);
    }, [originalTool]);

    const currentProbeState = currentTool?.status;
    const currentIsManual =
        allowManualBadge && (currentTool?.isManual ?? false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] gap-2">
                <DialogHeader>
                    <DialogTitle>Remap Tool T{originalTool}</DialogTitle>
                    <DialogDescription>
                        Select a new tool number to remap T{originalTool}.
                        Unavailable tools are shown but disabled.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="tool-select">New Tool Number</Label>
                        <Select
                            value={selectedTool}
                            onValueChange={setSelectedTool}
                        >
                            <SelectTrigger id="tool-select">
                                <SelectValue asChild>
                                    {selectedToolInfo ? (
                                        <div className="flex items-center gap-3 w-full flex-1 min-w-0">
                                            <span className="flex-1 min-w-0 font-mono font-medium truncate">
                                                {formatToolLabel(
                                                    selectedToolInfo,
                                                    selectedToolNumber,
                                                )}
                                            </span>
                                                <ToolStatusBadges
                                                    probeState={
                                                        selectedToolInfo.status
                                                    }
                                                    isManual={
                                                        selectedToolInfo.isManual &&
                                                        allowManualBadge
                                                    }
                                                    size="sm"
                                                    className="ml-auto"
                                                />
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            Select a tool
                                        </span>
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="z-[10000] bg-white dark:bg-dark">
                                {allTools.map((tool) => {
                                    tool = { ...tool };
                                    const available = isToolAvailable(tool.id);

                                    //const status = toolStateThemes[tool.status];

                                    const stateStyle =
                                        toolStateThemes[tool.status];

                                    const toolIsManual = allowManualBadge
                                        ? tool.isManual ?? false
                                        : false;

                                    return (
                                        <SelectPrimitive.Item
                                            key={tool.id}
                                            value={tool.id.toString()}
                                            disabled={!available}
                                            className={cn(
                                                'relative flex w-full bg-white dark:bg-dark cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                                                'border-l-4',
                                                stateStyle.borderColor,
                                                !available &&
                                                    'cursor-not-allowed',
                                            )}
                                            style={
                                                !available
                                                    ? {
                                                          backgroundImage:
                                                              'repeating-linear-gradient(45deg, rgb(249 250 251) 0, rgb(249 250 251) 6px, transparent 6px, transparent 12px)',
                                                      }
                                                    : ''
                                            }
                                        >
                                            <SelectPrimitive.ItemText asChild>
                                                <div className="flex items-center gap-3 w-full">
                                                    <span className="flex-1 min-w-0 font-mono font-medium truncate">
                                                        {formatToolLabel(tool)}
                                                    </span>
                                                    <ToolStatusBadges
                                                        probeState={tool.status}
                                                        isManual={toolIsManual}
                                                        size="sm"
                                                        showLabel={false}
                                                        className="ml-auto"
                                                    />
                                                </div>
                                            </SelectPrimitive.ItemText>
                                            {/*<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                                    <SelectPrimitive.ItemIndicator>
                                                        <CheckCircle className="h-4 w-4" />
                                                    </SelectPrimitive.ItemIndicator>
                                                </span>*/}
                                        </SelectPrimitive.Item>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-lg">
                                {formatToolNumber(originalTool)}
                            </span>
                            {currentProbeState ? (
                                <ToolStatusBadges
                                    probeState={currentProbeState}
                                    isManual={currentIsManual}
                                    size="sm"
                                />
                            ) : (
                                <Badge
                                    variant="outline"
                                    className={cn('text-xs font-medium')}
                                >
                                    {toolStateThemes.current.label}
                                </Badge>
                            )}
                        </div>

                        <ArrowRight className="h-5 w-5 text-muted-foreground" />

                        <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-lg text-primary">
                                {formatToolNumber(parseInt(selectedTool))}
                            </span>
                            {getToolInfo(parseInt(selectedTool)) && (
                                <ToolStatusBadges
                                    probeState={
                                        getToolInfo(parseInt(selectedTool))!
                                            .status
                                    }
                                    isManual={
                                        getToolInfo(parseInt(selectedTool))!
                                            .isManual
                                    }
                                    size="sm"
                                />
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedTool}>
                        Confirm Remap
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
