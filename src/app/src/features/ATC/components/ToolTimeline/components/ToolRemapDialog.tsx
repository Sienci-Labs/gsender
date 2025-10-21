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
    CheckCircle,
    AlertTriangle,
    XCircle,
    Ban,
} from 'lucide-react';
import cn from 'classnames';
import type { Tool } from './types';
import { ToolInstance } from 'app/features/ATC/components/ToolTable.tsx';

interface ToolRemapDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    originalTool: Number;
    allTools: ToolInstance[];
    passedTools: number[];
    existingMappings: Map<number, number>;
    onConfirm: (fromTool: number, toTool: number) => void;
}

const statusConfig = {
    probed: {
        label: 'Probed',
        className:
            'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    },
    unprobed: {
        label: 'Unprobed',
        className:
            'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
    },
    offrack: {
        label: 'Off-Rack',
        className:
            'bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/30',
    },
};

const toolStateStyles = {
    probed: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-600',
        icon: CheckCircle,
    },
    unprobed: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-600',
        icon: XCircle,
    },
    offrack: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-500',
        icon: AlertTriangle,
    },
    disabled: {
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        border: 'border-gray-400',
        icon: Ban,
    },
};

export function ToolRemapDialog({
    open,
    onOpenChange,
    originalTool,
    allTools,
    passedTools,
    existingMappings,
    onConfirm,
}: ToolRemapDialogProps) {
    const [selectedTool, setSelectedTool] = useState<string>('');
    const [currentTool, setCurrentTool] = useState<Tool | null>(null);

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

        const mappedTo = Array.from(existingMappings.values());
        if (mappedTo.includes(toolNumber)) return false;

        const isPassedTool = passedTools.includes(toolNumber);
        const toolIsRemapped = existingMappings.has(toolNumber);

        return !(isPassedTool && !toolIsRemapped);
    };

    const getToolInfo = (toolNumber: number): Tool | undefined => {
        return allTools.find((t) => t.id === toolNumber);
    };

    useEffect(() => {
        const tool = getToolInfo(originalTool);
        setCurrentTool(tool);
    }, [originalTool]);

    const originalStatus = statusConfig[currentTool?.status] || 'unprobed';

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
                                <SelectValue placeholder="Select a tool" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000] bg-white">
                                {allTools.map((tool) => {
                                    const available = isToolAvailable(tool.id);

                                    const isMapped = Array.from(
                                        existingMappings.values(),
                                    ).includes(tool.id);
                                    const isPassedTool = passedTools.includes(
                                        tool.id,
                                    );
                                    const isUsed = isMapped || isPassedTool;

                                    const status = isUsed
                                        ? {
                                              label: 'Used',
                                              className:
                                                  'text-gray-600 border-gray-300',
                                          }
                                        : statusConfig[tool.status];
                                    if (tool.id === originalTool) {
                                        status.label = 'Original';
                                    }
                                    if (isMapped) {
                                        if (
                                            tool.id ===
                                            existingMappings.get(originalTool)
                                        ) {
                                            status.label == 'Current';
                                        }
                                    }

                                    const stateStyle = available
                                        ? toolStateStyles[tool.status]
                                        : toolStateStyles.disabled;
                                    //const stateStyle = toolStateStyles[status];

                                    const IconComponent = stateStyle.icon;

                                    return (
                                        <SelectPrimitive.Item
                                            key={tool.id}
                                            value={tool.id.toString()}
                                            disabled={!available}
                                            className={cn(
                                                'relative flex w-full bg-white cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                                                'border-l-4',
                                                stateStyle.border,
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
                                            <SelectPrimitive.ItemText>
                                                <div className="flex items-center justify-between gap-3 w-full pr-6">
                                                    <span className="font-mono font-medium">
                                                        T{tool.id}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'text-xs font-medium flex items-center gap-1.5 shrink-0 w-24 justify-center',
                                                            status.className,
                                                        )}
                                                    >
                                                        <IconComponent className="h-3.5 w-3.5" />
                                                        {status.label}
                                                    </Badge>
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
                                T{originalTool}
                            </span>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-xs font-medium',
                                    originalStatus.className,
                                )}
                            >
                                {originalStatus.label}
                            </Badge>
                        </div>

                        <ArrowRight className="h-5 w-5 text-muted-foreground" />

                        <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-lg text-primary">
                                {selectedTool && `T${selectedTool}`}
                            </span>
                            {getToolInfo(parseInt(selectedTool)) && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'text-xs font-medium',
                                        statusConfig[
                                            getToolInfo(parseInt(selectedTool))!
                                                .status
                                        ].className,
                                    )}
                                >
                                    {
                                        statusConfig[
                                            getToolInfo(parseInt(selectedTool))!
                                                .status
                                        ].label
                                    }
                                </Badge>
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
