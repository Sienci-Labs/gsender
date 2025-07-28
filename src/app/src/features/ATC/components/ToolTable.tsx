import controller from 'app/lib/controller.ts';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from 'app/components/shadcn/Collapsible.tsx';
import { Badge } from 'app/features/ATC/components/ui/Badge.tsx';
import { ChevronDown } from 'lucide-react';
import { StatusBadge } from 'app/features/ATC/components/ui/StatusBadge.tsx';
import { ProbeButton } from 'app/features/ATC/components/ui/ProbeButton.tsx';
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
import { FIXED_RACK_SIZE } from 'app/features/ATC/utils/ATCiConstants.ts';
import partition from 'lodash/partition';

export type ToolStatus = 'probed' | 'unprobed' | 'offrack';

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
    onProbe,
    defaultOpen = true,
}: {
    title: string;
    tools: ToolInstance[];
    onProbe?: (toolId: string) => void;
    defaultOpen?: boolean;
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
                            <TableRow>
                                <TableHead>Tool</TableHead>
                                <TableHead>Z Offset</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>
                                    {defaultOpen ? (
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={probeEntireRack}
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
                                <TableRow key={tool.id}>
                                    <TableCell className="font-mono">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">
                                                T{tool.id}
                                            </span>
                                            <ToolNameInput
                                                id={tool.id}
                                                nickname={tool.nickname}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="inline-block w-[120px] px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-center rounded-md font-mono font-semibold text-sm text-blue-500">
                                            {tool.toolOffsets.z.toFixed(3)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={tool.status} />
                                    </TableCell>
                                    <TableCell>
                                        <ProbeButton
                                            status={tool.status}
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

export function ToolTable({ tools = [] }: ToolTableProps) {
    const [onRackTools, offRackTools] = partition(
        tools,
        (tool) => tool.id <= FIXED_RACK_SIZE,
    );
    console.log(onRackTools);
    console.log(offRackTools);
    return (
        <div className="sm:rounded-lg w-full h-[500px] gap-1 flex flex-col">
            <ToolSection
                title="On-Rack Tools"
                tools={onRackTools}
                onProbe={() => {}}
                defaultOpen={true}
            />
            <ToolSection
                title="Off-Rack Tools"
                tools={offRackTools}
                onProbe={() => {}}
                defaultOpen={false}
            />
        </div>
    );
}
