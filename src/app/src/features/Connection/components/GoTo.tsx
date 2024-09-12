import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover.tsx';
import { FaPaperPlane } from 'react-icons/fa6';
import { Button } from 'app/components/Button';
import { UnitInput } from 'app/components/UnitInput';
import { DROPosition } from 'app/features/DRO/utils/DRO.ts';

interface GotoProps {
    units: string;
    wpos: DROPosition;
}

export function GoTo({ units, wpos }: GotoProps) {
    return (
        <Popover>
            <PopoverTrigger className="border rounded hover:opacity-90 py-1 px-3 shadow border-blue-500 text-white bg-blue-500">
                <FaPaperPlane />
            </PopoverTrigger>
            <PopoverContent className="bg-white">
                <div className="w-full gap-2 flex flex-col">
                    <h1>Go To Location</h1>
                    <UnitInput units={units} label="X" />
                    <UnitInput units={units} label="Y" />
                    <UnitInput units={units} label="Z" />
                    <UnitInput units="°" label="A" />

                    <Button color="primary">Go!</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
