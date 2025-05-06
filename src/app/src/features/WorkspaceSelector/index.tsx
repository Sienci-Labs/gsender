import { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select';
import controller from 'app/lib/controller.ts';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';

const availableWorkspaces = {
    G54: 'P1',
    G55: 'P2',
    G56: 'P3',
    G57: 'P4',
    G58: 'P5',
    G59: 'P6',
};

export type GrblWorkspace = 'G54' | 'G55' | 'G56' | 'G57' | 'G58' | 'G59';

export function WorkspaceSelector() {
    const activeWorkspace = useSelector(
        (state: RootState) => state.controller.modal.wcs,
    );
    const isConnected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const [workspace, setWorkspace] = useState<GrblWorkspace>('G54');

    // Update selected workspace if it changes elsewhere
    useEffect(() => {
        setWorkspace(activeWorkspace);
    }, [activeWorkspace]);

    function onWorkspaceSelect(value: GrblWorkspace) {
        setWorkspace(value);
        controller.command('gcode', value);
    }

    return (
        <div className="absolute top-4 right-4 w-56 max-sm:static flex flex-row items-center justify-end gap-2">
            <span className="text-gray-400 text-normal">Workspace:</span>
            <Select
                onValueChange={onWorkspaceSelect}
                value={workspace}
                disabled={!isConnected}
            >
                <SelectTrigger className="max-w-24 h-7 bg-white rounded-md border-solid border border-gray-300">
                    <SelectValue placeholder="G54" />
                </SelectTrigger>
                <SelectContent className="flex-1 bg-white">
                    <SelectGroup className="bg-white">
                        {Object.entries(availableWorkspaces).map(
                            (option, _index) => {
                                const [key, value] = option;
                                return (
                                    <SelectItem
                                        key={key}
                                        value={key}
                                        className="bg-white h-8"
                                    >
                                        {`${key} (${value})`}
                                    </SelectItem>
                                );
                            },
                        )}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
