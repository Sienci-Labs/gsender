import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { PositionSetter } from 'app/features/AccessoryInstaller/Wizards/atc/components/PositionSetter.tsx';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { useEffect, useRef, useState } from 'react';
import store from 'app/store';
import controller from 'app/lib/controller.ts';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { mapPositionToUnits, in2mm } from 'app/lib/units.ts';
import { IMPERIAL_UNITS } from 'app/constants';
import { getDefaultToolChangePositionMM } from 'app/features/AccessoryInstaller/Wizards/tls/utils/defaultToolChangePosition.ts';
import pubsub from 'pubsub-js';

type Position = { x?: number; y?: number; z?: number };

function mposEquals(a: Position | undefined, b: Position | undefined) {
    if (!a || !b) return a === b;
    return a.x === b.x && a.y === b.y && a.z === b.z;
}

export function ManualToolChangePosition({
    onComplete,
    onUncomplete,
}: StepProps) {
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { units } = useWorkspaceState();
    const mpos = useSelector((state: RootState) => state.controller.mpos);
    const isManuallyEditing = useRef(false);
    const mposAtMountRef = useRef(mpos);

    const [position, setPosition] = useState(() => {
        const defaultXY = getDefaultToolChangePositionMM();
        return {
            x: defaultXY ? mapPositionToUnits(defaultXY.x, units) : '0',
            y: defaultXY ? mapPositionToUnits(defaultXY.y, units) : '0',
            z: '0',
        };
    });

    useEffect(() => {
        if (isManuallyEditing.current) return;
        if (!mpos || mpos.x === undefined || mpos.y === undefined || mpos.z === undefined) return;
        // No real jog has happened since entering the step yet — keep the
        // computed default instead of clobbering it with the raw mpos.
        if (mposEquals(mpos, mposAtMountRef.current)) return;
        const { x, y, z } = mpos;
        setPosition({
            x: mapPositionToUnits(x, units),
            y: mapPositionToUnits(y, units),
            z: mapPositionToUnits(z, units),
        });
    }, [mpos, units]);

    const toMM = (val: string) =>
        units === IMPERIAL_UNITS ? in2mm(Number(val)) : Number(val);

    const setManualPosition = () => {
        store.set('workspace.toolChange.manualPosition', {
            x: toMM(position.x),
            y: toMM(position.y),
            z: toMM(position.z),
        });
        pubsub.publish('repopulate');
        setSuccess('Tool change location set.');
        setIsComplete(true);
        onComplete();
    };

    const goToPosition = () => {
        const target = {
            x: toMM(position.x),
            y: toMM(position.y),
            z: toMM(position.z),
        };
        controller.command('gcode', [
            'G53 G21 G0 Z-1',
            `G53 G21 G0 X${target.x} Y${target.y}`,
            `G53 G21 G0 Z${target.z}`,
        ]);
    };

    return (
        <div className="flex flex-col gap-5 justify-start">
            <p className="dark:text-white">
                Jog to the location you'd like the machine to move to for
                manual tool changes, then set the position using the{' '}
                <b>"Set Position"</b> button.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                The fields below are already filled with a recommended position.
                Hit <b>"Go To"</b> to send the machine there, then jog to
                fine-tune it from that starting point before setting the
                position.
            </p>
            <PositionSetter
                showZ={true}
                xPosition={position.x}
                yPosition={position.y}
                zPosition={position.z}
                units={units}
                onPositionChange={(positions) => {
                    isManuallyEditing.current = true;
                    setPosition(positions);
                }}
                showGoTo={true}
                onGoTo={goToPosition}
                actionButton={
                    <StepActionButton
                        label={'Set Position'}
                        runningLabel="Setting..."
                        onApply={setManualPosition}
                        isComplete={isComplete}
                        error={error}
                        success={success}
                    />
                }
            />
        </div>
    );
}
