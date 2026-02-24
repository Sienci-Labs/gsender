import controller from 'app/lib/controller.ts';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from 'app/components/shadcn/Collapsible.tsx';
import { Badge } from 'app/features/ATC/components/ui/Badge.tsx';
import { ChevronDown } from 'lucide-react';
import { ProbeButton } from 'app/features/ATC/components/ui/ProbeButton.tsx';
import { ToolStatusBadges } from 'app/features/ATC/components/ui/ToolStatusBadges.tsx';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'app/components/shadcn/Table';

import { ToolNameInput } from 'app/features/ATC/components/ToolNameInput.tsx';
import Button from 'app/components/Button';
import partition from 'lodash/partition';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { ToolProbeState } from 'app/features/ATC/types.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import get from 'lodash/get';
import store from "app/store";

export type ToolStatus = ToolProbeState;

export interface ToolInstance {
    id: number;
    toolOffsets: {
        x: number;
        y: number;
        z: number;
        a?: number;
        b?: number;
        c?: number;
    };
    toolRadius: number;
    nickname?: string;
    status: ToolStatus;
    isManual?: boolean;
}

export function probeRackTool(toolID: number) {
    controller.command('gcode', [`G65 P301 Q${toolID}`, '$#']);
}

export function probeEntireRack() {
    controller.command('gcode', ['G65 P300', '$#']);
}

const ToolSection = ({
    title,
    tools,
    disabled,
    defaultOpen = true,
    allowManualBadge = false,
}: {
    title: string;
    tools: ToolInstance[];
    onProbe?: (toolId: string) => void;
    defaultOpen?: boolean;
    disabled?: boolean;
    allowManualBadge?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-100/30 hover:bg-muted/50 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-blue-500">{title}</h3>
                    <Badge
                        variant="secondary"
                        className="min-w-[30px] justify-center"
                    >
                        {tools.length}
                    </Badge>
                </div>
                <ChevronDown
                    className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </CollapsibleTrigger>
            <CollapsibleContent className="">
                <div className="mt-2">
                    <Table>
                        <TableHeader>
                            <TableRow className="grid grid-cols-[2fr_1fr_1fr_1fr] portrait:grid-cols-[2fr_1fr_1fr]">
                                <TableHead>Tool</TableHead>
                                <TableHead className={'portrait:hidden'}>
                                    Z Offset
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>
                                    {defaultOpen ? (
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={probeEntireRack}
                                            disabled={disabled}
                                        >
                                            Probe All
                                        </Button>
                                    ) : (
                                        'Actions'
                                    )}
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {tools.map((tool) => (
                                <TableRow
                                    key={tool.id}
                                    className="grid grid-cols-[2fr_1fr_1fr_1fr] portrait:grid-cols-[2fr_1fr_1fr] items-center [&>td]:flex [&>td]:items-center"
                                >
                                    <TableCell className="font-mono w-full">
                                        <div className="flex flex-col w-full">
                                            <span className="font-semibold">
                                                T{tool.id}
                                            </span>
                                            <ToolNameInput
                                                id={tool.id}
                                                nickname={tool.nickname}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="portrait:flex portrait:flex-col portrait:gap-2 portrait:items-center">
                                        <div className="portrait:block hidden">
                                            <ToolStatusBadges
                                                probeState={tool.status}
                                                isManual={
                                                    tool.isManual &&
                                                    allowManualBadge
                                                }
                                                size="sm"
                                            />
                                        </div>
                                        <div className="inline-block w-[120px] px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-center rounded-md font-mono font-semibold text-sm text-blue-500">
                                            {tool.toolOffsets.z.toFixed(3)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="portrait:hidden">
                                        <ToolStatusBadges
                                            probeState={tool.status}
                                            isManual={
                                                tool.isManual &&
                                                allowManualBadge
                                            }
                                            size="sm"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <ProbeButton
                                            onProbe={() =>
                                                probeRackTool(tool.id)
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

export interface IToolListing {
    [key: number]: ToolInstance;
}

export interface ToolTableProps {
    tools: ToolInstance[];
    onProbe?: (toolId: string) => void;
}

export function ToolTable({ tools = [], disabled }: ToolTableProps) {
    const { rackSize, connected, atcAvailable } = useToolChange();
    const allowManualBadge = connected && atcAvailable;
    const reportedRackEnable = Number(
        store.get('widgets.atc.templates.variables._tc_rack_enable.value', 1)
    );
    const rackEnabled = reportedRackEnable !== 0;

    const [onRackTools, offRackTools] = partition(
        tools,
        (tool) => rackEnabled && tool.id <= rackSize,
    );

    return (
        <div className="sm:rounded-lg w-full h-[500px] gap-1 flex flex-col">
            <ToolSection
                title="Rack Loaded Tools"
                tools={onRackTools}
                onProbe={() => {}}
                defaultOpen={rackEnabled}
                disabled={disabled}
                allowManualBadge={allowManualBadge}
            />
            <ToolSection
                title="Manually Loaded Tools"
                tools={offRackTools}
                onProbe={() => {}}
                defaultOpen={!rackEnabled}
                disabled={disabled}
                allowManualBadge={allowManualBadge}
            />
        </div>
    );
}
