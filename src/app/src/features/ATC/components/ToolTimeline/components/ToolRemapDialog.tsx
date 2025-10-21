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
import {
    getToolStateClasses,
    toolStateThemes,
} from 'app/features/ATC/utils/ATCiConstants.ts';
import { undefined } from 'zod';

interface ToolRemapDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    originalTool: Number;
    allTools: ToolInstance[];
    passedTools: number[];
    existingMappings: Map<number, number>;
    onConfirm: (fromTool: number, toTool: number) => void;
}

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
    const [currentTool, setCurrentTool] = useState<Tool>({
        number: 0,
        status: 'current',
    });

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

    const originalStatus =
        toolStateThemes[currentTool?.status] || toolStateThemes['current'];

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
                                    tool = { ...tool };
                                    const available = isToolAvailable(tool.id);

                                    const isMapped = Array.from(
                                        existingMappings.values(),
                                    ).includes(tool.id);
                                    const isPassedTool = passedTools.includes(
                                        tool.id,
                                    );
                                    const isUsed = isMapped || isPassedTool;

                                    if (isUsed) {
                                        tool.status = 'used';
                                    }

                                    //const status = toolStateThemes[tool.status];

                                    const stateStyle = available
                                        ? toolStateThemes[tool.status]
                                        : toolStateThemes.used;

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
                                                            getToolStateClasses(
                                                                tool.status,
                                                            ),
                                                        )}
                                                    >
                                                        <IconComponent className="h-4 w-4" />
                                                        {stateStyle.label}
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
                                    getToolStateClasses(currentTool?.status),
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
                                        getToolStateClasses(
                                            getToolInfo(parseInt(selectedTool))!
                                                .status,
                                        ),
                                    )}
                                >
                                    {
                                        toolStateThemes[
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
