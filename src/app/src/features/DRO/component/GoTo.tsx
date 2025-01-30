import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover.tsx';
import { FaPaperPlane } from 'react-icons/fa6';
import { Button } from 'app/components/Button';
import { UnitInput } from 'app/components/UnitInput';
import { DROPosition } from 'app/features/DRO/utils/DRO.ts';
import { Switch } from 'app/components/shadcn/Switch.tsx';
import { useState } from 'react';
import controller from 'app/lib/controller';

interface GotoProps {
    units: string;
    wpos: DROPosition;
    disabled: boolean;
}

export function GoTo({ units, wpos, disabled }: GotoProps) {
    const [movementMode, setMovementMode] = useState(false);
    const [movementPos, setMovementPos] = useState({
        x: 0,
        y: 0,
        z: 0,
        a: 0,
        b: 0,
        c: 0,
    });

    const onToggleSwap = () => {
        setMovementMode(!movementMode);
        console.log(movementMode);
    };

    function goToLocation() {
        console.log('called movement');
        const code = [];
        const unitModal = 'G90';
        const movementModal = movementMode ? 'G91' : 'G90'; // Is G91 enabled?
        code.push(
            movementModal,
            `G0 X${movementPos.x} Y${movementPos.y} Z${movementPos.z}`,
        );
        controller.command('gcode:safe', code, unitModal);
    }

    return (
        <Popover>
            <PopoverTrigger
                disabled={disabled}
                className="border rounded hover:opacity-90 px-3 shadow border-robin-500 text-white bg-robin-500 disabled:bg-gray-300 disabled:border-gray-500 disabled:text-gray-500"
            >
                <FaPaperPlane />
            </PopoverTrigger>
            <PopoverContent className="bg-white">
                <div className="w-full gap-2 flex flex-col">
                    <h1>Go To Location</h1>
                    <UnitInput units={units} label="X" value={wpos.x} />
                    <UnitInput units={units} label="Y" value={wpos.y} />
                    <UnitInput units={units} label="Z" value={wpos.z} />
                    <UnitInput units="deg" label="A" value={wpos.a} />
                    <div className="flex flex-row text-sm text-gray-400 justify-between">
                        <span>G90</span>
                        <Switch onClick={onToggleSwap} />
                        <span>G91</span>
                    </div>
                    <Button color="primary" onClick={goToLocation}>
                        Go!
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
