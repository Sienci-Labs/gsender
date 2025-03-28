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
import { useEffect, useState } from 'react';
import controller from 'app/lib/controller';
import { IconButton } from 'app/components/IconButton';

interface GotoProps {
    units: string;
    wpos: DROPosition;
    disabled: boolean;
}

export function GoTo({ units, wpos, disabled }: GotoProps) {
    const [relativeMovement, setRelativeMovement] = useState(false);
    const [movementPos, setMovementPos] = useState({
        x: 0,
        y: 0,
        z: 0,
        a: 0,
        b: 0,
        c: 0,
    });

    useEffect(() => {
        if (relativeMovement) {
            setMovementPos({
                x: 0,
                y: 0,
                z: 0,
                a: 0,
                b: 0,
                c: 0,
            });
        } else {
            setMovementPos({
                ...movementPos,
                x: Number(wpos.x),
                y: Number(wpos.y),
                z: Number(wpos.y),
                a: Number(wpos.a),
            });
        }
    }, [relativeMovement]);

    const onToggleSwap = () => {
        setRelativeMovement(!relativeMovement);
    };

    function goToLocation() {
        const code = [];
        const unitModal = 'G90';
        const movementModal = relativeMovement ? 'G91' : 'G90'; // Is G91 enabled?
        code.push(
            movementModal,
            `G0 X${movementPos.x} Y${movementPos.y} Z${movementPos.z}`,
        );
        controller.command('gcode:safe', code, unitModal);
    }

    function onValueEdit(e: React.ChangeEvent<HTMLInputElement>, axis: string) {
        const value = e.target.value;
        const payload = {
            ...movementPos,
            [axis]: value,
        };
        setMovementPos(payload);
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <IconButton icon={<FaPaperPlane />} disabled={false} />
            </PopoverTrigger>
            <PopoverContent className="bg-white">
                <div className="w-full gap-2 flex flex-col">
                    <h1>Go To Location</h1>
                    <UnitInput
                        units={units}
                        label="X"
                        value={movementPos.x}
                        onChange={(v) => onValueEdit(v, 'x')}
                    />
                    <UnitInput
                        units={units}
                        label="Y"
                        value={movementPos.y}
                        onChange={(v) => onValueEdit(v, 'y')}
                    />
                    <UnitInput
                        units={units}
                        label="Z"
                        value={movementPos.z}
                        onChange={(v) => onValueEdit(v, 'z')}
                    />
                    <UnitInput
                        units="deg"
                        label="A"
                        value={movementPos.a}
                        onChange={(v) => onValueEdit(v, 'a')}
                    />
                    <div className="flex flex-row text-sm text-gray-400 justify-between">
                        <span>ABS</span>
                        <Switch onClick={onToggleSwap} />
                        <span>INC</span>
                    </div>
                    <Button color="primary" onClick={goToLocation}>
                        Go!
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
