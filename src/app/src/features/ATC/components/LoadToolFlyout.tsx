import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from 'app/components/shadcn/Popover.tsx';
import Button from 'app/components/Button';
import { TCStatusIndicator } from 'app/features/ATC/components/TCStatusIndicator.tsx';
import {
    Select,
    SelectContent,
    SelectTrigger,
    SelectItem,
} from 'app/components/shadcn/Select.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { useEffect, useState } from 'react';
import store from 'app/store';
import get from 'lodash/get';

function mapToolTableToIdentifiers(toolTable = {}) {
    const labels = store.get('widgets.atc.toolMap', {});
    const mappedValue = [];
    Object.entries(toolTable).forEach(([key, value]) => {
        let labelledTool = { ...value };
        labelledTool.label = get(labels, value.id, '-');
        mappedValue.push(value);
    });

    return mappedValue;
}

export function LoadToolFlyout() {
    const [mappedTable, setMappedTable] = useState([]);
    const [selectedTool, setSelectedTool] = useState(1);
    const toolTable = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
    );

    useEffect(() => {
        setMappedTable(mapToolTableToIdentifiers(toolTable));
    }, [toolTable]);

    return (
        <Popover>
            <PopoverTrigger>
                <Button>Load Tool</Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-[450px] h-[150px]">
                <div className="grid grid-cols-[2fr_1fr] h-full">
                    <div className="pr-2">
                        <h1 className="font-bold mb-2">Select Slot</h1>
                        <div className="flex flex-row justify-between gap-1">
                            <Select value={selectedTool}>
                                <SelectTrigger>
                                    T1 - 1/4" End Mill
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {mappedTable.map((tool) => {
                                        return (
                                            <SelectItem>{tool.id}</SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <div>
                                <Button variant="primary">Load</Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 justify-between h-full">
                        <TCStatusIndicator />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
