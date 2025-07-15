import { unimplemented } from 'app/features/ATC/utils/ATCFunctions.ts';
import Button from 'app/components/Button';
import controller from 'app/lib/controller.ts';
import { ToolNameInput } from 'app/features/ATC/components/ToolNameInput.tsx';

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
}

export function probeRackTool(toolID: number) {
    controller.command('gcode', [`G65 P301 Q${toolID}`, '$#']);
}

export function probeEntireRack() {
    controller.command('gcode', ['G65 P300', '$#']);
}

export function ToolTable({ tools = {} }) {
    return (
        <div className="shadow-md sm:rounded-lg w-full">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
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
                        <th scope="col" className="px-6 py-3">
                            X
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Y
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
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => probeRackTool(value.id)}
                                    >
                                        Probe
                                    </Button>
                                </td>
                                <td className="px-4 py-2">
                                    {value.toolOffsets.x}
                                </td>
                                <td className="px-4 py-2">
                                    {value.toolOffsets.y}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
