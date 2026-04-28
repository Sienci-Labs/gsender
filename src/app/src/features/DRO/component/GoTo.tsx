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
import controller from 'app/lib/controller';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { METRIC_UNITS } from 'app/constants';
import Tooltip from 'app/components/Tooltip';
import store from 'app/store';
import { get } from 'lodash';
import { RootState } from 'app/store/redux';

type MovementMode = 'abs' | 'inc' | 'mcs';

interface GotoProps {
    units: string;
    wpos: DROPosition;
    disabled: boolean;
}

export function GoTo({ units, wpos, disabled }: GotoProps) {
    const { mode } = useWorkspaceState();
    const [hasAAxisReported, setHasAAxisReported] = useState<boolean>(false);

    const axes = useTypedSelector(
        (state: RootState) => state.controller.state.axes?.axes,
    );
    const controllerType = useTypedSelector((state) => state.controller.type);
    const hasHomed = useTypedSelector(
        (state: RootState) => state.controller.hasHomed,
    );
    const homingSetting = useTypedSelector((state: RootState) =>
        Number(get(state, 'controller.settings.settings.$22', 0)),
    );
    const mcsAvailable = hasHomed && homingSetting !== 0;

    const [movementMode, setMovementMode] = useState<MovementMode>('abs');
    const [movementPos, setMovementPos] = useState({
        x: 0,
        y: 0,
        z: 0,
        a: 0,
        b: 0,
        c: 0,
    });

    useEffect(() => {
        if (axes) {
            setHasAAxisReported(axes.includes('A'));
        } else {
            setHasAAxisReported(false);
        }
    }, [axes]);

    useEffect(() => {
        if (movementMode === 'inc') {
            setMovementPos({ x: 0, y: 0, z: 0, a: 0, b: 0, c: 0 });
        } else if (movementMode === 'abs') {
            setMovementPos({
                ...movementPos,
                x: Number(wpos.x),
                y: Number(wpos.y),
                z: Number(wpos.z),
                a: Number(wpos.a),
            });
        } else if (movementMode === 'mcs') {
            const mpos = get(controller, 'state.status.mpos', {});
            setMovementPos({
                ...movementPos,
                x: Number(mpos.x ?? 0),
                y: Number(mpos.y ?? 0),
                z: Number(mpos.z ?? 0),
                a: Number(mpos.a ?? 0),
            });
        }
    }, [movementMode]);

    // If MCS becomes unavailable while selected, fall back to abs
    useEffect(() => {
        if (movementMode === 'mcs' && !mcsAvailable) {
            setMovementMode('abs');
        }
    }, [mcsAvailable]);

    const isInRotaryMode = mode === 'ROTARY';
    const aAxisIsAvailable =
        isInRotaryMode || (controllerType === 'grblHAL' && hasAAxisReported);
    const yAxisIsAvailable = !isInRotaryMode;

    const onModeChange = (newMode: MovementMode) => {
        setMovementMode(newMode);
    };

    function goToLocation() {
        const code = [];
        const unitModal = units === METRIC_UNITS ? 'G21' : 'G20';
        const originalZ = Number(get(controller, 'state.status.wpos.z', 0));

        const axisValues = [];
        axisValues.push(`X${movementPos.x}`);
        if (yAxisIsAvailable) {
            axisValues.push(`Y${movementPos.y}`);
        }
        if (aAxisIsAvailable) {
            axisValues.push(`A${movementPos.a}`);
        }

        if (axisValues.length === 0) {
            return;
        }

        if (movementMode === 'mcs') {
            code.push(`G53 G0 ${axisValues.join(' ')}`);
        } else {
            const movementModal = movementMode === 'inc' ? 'G91' : 'G90';
            const retractHeight = Number(
                store.get('workspace.safeRetractHeight', -1),
            );
            const settings = get(controller.settings, 'settings', {});
            const homingSettingVal = Number(get(settings, '$22', 0));
            const homingEnabled = homingSettingVal !== 0;

            if (retractHeight !== 0) {
                if (homingEnabled) {
                    const currentZ = Number(
                        get(controller, 'state.status.mpos.z', 0),
                    );
                    const retract = Math.abs(retractHeight) * -1;
                    if (currentZ < retract) {
                        code.push(`G53 G0 Z${retract}`);
                    }
                } else {
                    code.push('G91');
                    code.push(`G0Z${retractHeight}`);
                }
            }

            code.push(movementModal, `G0 ${axisValues.join(' ')}`);

            // if relative, move z back down safe height
            if (
                retractHeight !== 0 &&
                !homingEnabled &&
                movementModal === 'G91'
            ) {
                const zMove = Number(movementPos.z) + Number(originalZ);
                code.push(`G90 G0 Z${zMove}`); // go to the absolute position of where the previous Z pos was + the incremental move
            } else {
                code.push(movementModal, `G0 Z${movementPos.z}`);
            }
        }

        controller.command('gcode:safe', code, unitModal);
    }

    function onValueEdit(e: React.ChangeEvent<HTMLInputElement>, axis: string) {
        const value = e.target.value;
        setMovementPos({ ...movementPos, [axis]: value });
    }

    function onPopoverOpen(open: boolean) {
        if (open) {
            if (movementMode === 'inc') {
                setMovementPos({ ...movementPos, x: 0, y: 0, z: 0, a: 0 });
            } else if (movementMode === 'mcs') {
                const mpos = get(controller, 'state.status.mpos', {});
                setMovementPos({
                    ...movementPos,
                    x: Number(mpos.x ?? 0),
                    y: Number(mpos.y ?? 0),
                    z: Number(mpos.z ?? 0),
                    a: Number(mpos.a ?? 0),
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

    const modeLabels: { key: MovementMode; label: string }[] = [
        { key: 'abs', label: 'ABS' },
        { key: 'inc', label: 'INC' },
        ...(homingSetting !== 0
            ? [{ key: 'mcs' as MovementMode, label: 'MCS' }]
            : []),
    ];

    return (
        <Popover onOpenChange={onPopoverOpen}>
            <Tooltip content="Go To Location">
                <PopoverTrigger asChild>
                    <Button
                        disabled={disabled}
                        icon={<FaPaperPlane />}
                        variant="secondary"
                        size="sm"
                        aria-label="Open Go To Location dialog"
                    />
                </PopoverTrigger>
            </Tooltip>
            <PopoverContent className="bg-white">
                <div className="w-full gap-2 flex flex-col">
                    <h1>Go To Location</h1>
                    <div className="flex flex-row text-sm border rounded overflow-hidden">
                        {modeLabels.map(({ key, label }) => {
                            const isActive = movementMode === key;
                            const isDisabled = key === 'mcs' && !mcsAvailable;
                            return (
                                <button
                                    key={key}
                                    onClick={() =>
                                        !isDisabled && onModeChange(key)
                                    }
                                    className={`flex-1 py-1 text-xs font-medium transition-colors
                                        ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}
                                        ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    disabled={isDisabled}
                                    title={
                                        isDisabled
                                            ? 'Requires homing enabled ($22>0) and machine homed'
                                            : label
                                    }
                                    aria-pressed={isActive}
                                >
                                    {label}
                                </button>
                            );
                        })}
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
                        disabled={!yAxisIsAvailable}
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
                        disabled={!aAxisIsAvailable}
                    />

                    <Button
                        variant="alt"
                        onClick={goToLocation}
                        aria-label="Execute move to location"
                    >
                        Go!
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );Ï
}
