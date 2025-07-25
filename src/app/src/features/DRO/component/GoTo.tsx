import { useEffect, useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa6';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';
import { Button } from 'app/components/Button';
import { UnitInput } from 'app/components/UnitInput';
import { DROPosition } from 'app/features/DRO/utils/DRO';
import Switch from 'app/components/Switch';
import controller from 'app/lib/controller';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import {METRIC_UNITS} from "app/constants";

interface GotoProps {
    units: string;
    wpos: DROPosition;
    disabled: boolean;
}

export function GoTo({ units, wpos, disabled }: GotoProps) {
    const { mode } = useWorkspaceState();

    const controllerType = useTypedSelector((state) => state.controller.type);
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
                z: Number(wpos.z),
                a: Number(wpos.a),
            });
        }
    }, [relativeMovement]);

    const isInRotaryMode = mode === 'ROTARY';
    const aAxisIsAvailble = isInRotaryMode || controllerType === 'grblHAL';
    const yAxisIsAvailble = !isInRotaryMode;

    const onToggleSwap = () => {
        setRelativeMovement((prev) => !prev);
    };

    function goToLocation() {
        const code = [];
        const unitModal = (units === METRIC_UNITS) ? 'G21' : 'G20';
        const movementModal = relativeMovement ? 'G91' : 'G90'; // Is G91 enabled?

        // Build axis commands based on non-zero values
        const axes = [];
        axes.push(`X${movementPos.x}`);

        if (yAxisIsAvailble) {
            axes.push(`Y${movementPos.y}`);
        }

        axes.push(`Z${movementPos.z}`);

        if (aAxisIsAvailble) {
            axes.push(`A${movementPos.a}`);
        }

        // Only add movement command if there are axes to move
        if (axes.length > 0) {
            code.push(movementModal, `G0 ${axes.join(' ')}`);
        }

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
    function onPopoverOpen(open) {
        if (open) {
            if (relativeMovement) {
                setMovementPos({
                    ...movementPos,
                    x: Number(0),
                    y: Number(0),
                    z: Number(0),
                    a: Number(0),
                });
            } else {
                setMovementPos({
                    ...movementPos,
                    x: Number(wpos.x),
                    y: Number(wpos.y),
                    z: Number(wpos.z),
                    a: Number(wpos.a),
                });
            }
        }
    }

    return (
        <Popover onOpenChange={onPopoverOpen}>
            <PopoverTrigger asChild>
                <Button
                    disabled={disabled}
                    icon={<FaPaperPlane />}
                    variant="secondary"
                    size="sm"
                />
            </PopoverTrigger>
            <PopoverContent className="bg-white">
                <div className="w-full gap-2 flex flex-col">
                    <h1>Go To Location</h1>
                    <div className="flex flex-row text-sm text-gray-400 justify-between">
                        <span>ABS</span>
                        <Switch
                            checked={relativeMovement}
                            onChange={onToggleSwap}
                        />
                        <span>INC</span>
                    </div>
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
                        disabled={!yAxisIsAvailble}
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
                        disabled={!aAxisIsAvailble}
                    />

                    <Button variant="alt" onClick={goToLocation}>
                        Go!
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
