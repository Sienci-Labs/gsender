import { unimplemented } from 'app/features/ATC/utils/ATCFunctions.ts';
import Button from 'app/components/Button';
import controller from 'app/lib/controller.ts';
import { ToolNameInput } from 'app/features/ATC/components/ToolNameInput.tsx';
import { ATCStatusButton } from 'app/features/ATC/components/ATCStatusButton.tsx';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from 'app/components/shadcn/Collapsible.tsx';
import { Badge } from 'app/components/shadcn/Badge.tsx';
import { ChevronDown } from 'lucide-react';
import Table from 'app/components/Table';
import {
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
    TableCell,
} from 'app/components/shadcn/Table.tsx';

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
    description?: string;
}

export function probeRackTool(toolID: number) {
    controller.command('gcode', [`G65 P301 Q${toolID}`, '$#']);
}

export function probeEntireRack() {
    controller.command('gcode', ['G65 P300', '$#']);
}

const FIXED_RACK_SIZE = 8;

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
    console.log(tools);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{title}</h3>
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
            <CollapsibleContent>
                <div className="mt-2">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tool</TableHead>
                                <TableHead>Z Offset</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody></TableBody>
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
    tools: IToolListing;
    onProbe?: (toolId: string) => void;
}

export function ToolTable({ tools = {} }: ToolTableProps) {
    const onRackTools: ToolInstance[] = Object.values(tools).filter(
        (tool) => tool.id <= FIXED_RACK_SIZE,
    );
    const offRackTools: ToolInstance[] = Object.values(tools).filter(
        (tool) => tool.id > FIXED_RACK_SIZE,
    );

    return (
        <div className="sm:rounded-lg w-full h-[500px]">
            <ToolSection
                title="On-Rack Tools"
                tools={onRackTools}
                onProbe={() => {}}
                defaultOpen={true}
            />
            {/*<table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-lg text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            Tool/Rack
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Tool Name
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 flex flex-row items-center gap-4"
                        >
                            Z
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={probeEntireRack}
                            >
                                Probe All
                            </Button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(tools).map(([key, value]) => {
                        return (
                            <tr className="w-full odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 border-gray-200">
                                <th
                                    scope="row"
                                    className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                >
                                    {value.id}
                                </th>{' '}
                                <td className="px-4 py-2">
                                    <a
                                        href="#"
                                        className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                    >
                                        <ToolNameInput id={value.id} />
                                    </a>
                                </td>
                                <td className="px-4 py-2 flex flex-row items-center gap-4">
                                    {value.toolOffsets.z}
                                    <ATCStatusButton
                                        onClick={() => probeRackTool(value.id)}
                                        statusPredicate={() =>
                                            value.toolOffsets.z < 0
                                        }
                                    >
                                        Probe
                                    </ATCStatusButton>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
*/}
        </div>
    );
}
