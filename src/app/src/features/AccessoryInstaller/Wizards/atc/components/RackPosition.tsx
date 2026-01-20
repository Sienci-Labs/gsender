import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { useEffect, useState } from 'react';
import { PositionSetter } from 'app/features/AccessoryInstaller/Wizards/atc/components/PositionSetter.tsx';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import controller from 'app/lib/controller.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import store from 'app/store';

export function RackPosition({ onComplete, onUncomplete }: StepProps) {
    const [rackPositionMethod, setRackPositionMethod] =
        useState<string>('utility');
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const rackless =
        store.get(
            'widgets.atc.templates.variables._tc_rack_enable.value',
            0,
        ) === 0;

    const mpos = useSelector((state: RootState) => state.controller.mpos);
    const ATCIPositionSet = useTypedSelector(
        (state: RootState) => state.controller.settings.atci?.rack_set,
    );

    // Once we get a flag back, we can complete and move on to next step
    useEffect(() => {
        console.log('SETVAR:', ATCIPositionSet);
        if (ATCIPositionSet === '1') {
            onComplete();
            setIsComplete(true);
            setTimeout(() => {
                setIsComplete(false);
            }, 5000);
        }
    }, [ATCIPositionSet]);

    useEffect(() => {
        if (!mpos || !mpos.x || !mpos.y || !mpos.z) return;
        const { x, y, z } = mpos;
        setPosition({ x, y, z });
    }, [mpos]);

    const [position, setPosition] = useState({ x: '0', y: '0', z: '0' });

    const handleUseUtility = () => {
        controller.command('gcode', 'G65 P302');
    };

    const setPositionViaPositionSetting = () => {
        controller.command('gcode', [
            `G10 L2 P7 X${position.x} Y${position.y} Z${position.z}`,
            '$#',
        ]);
        setTimeout(() => {
            onComplete();
        }, 1500);
    };

    if (rackless) {
        return (
            <div className="flex flex-col gap-5 p-2 justify-start">
                <p>
                    For ATC Configuration, you selected “No Tool Rack” and so do
                    not need to set a rack position.
                </p>
                <p>
                    If you have a rack installed, please return to the previous
                    step to correct your selection.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 p-2 justify-start">
            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Finding Rack Position Method
                </label>
                <select
                    value={rackPositionMethod}
                    onChange={(e) => setRackPositionMethod(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="utility">Use Utility</option>
                    <option value="manual">Manual</option>
                </select>
            </div>
            {rackPositionMethod === 'utility' && (
                <>
                    <p>
                        Position the spindle until the tool-stud sensor is
                        almost touching the right-most tool-stud, as in the
                        provided image. The LED on the sensor should light up.
                    </p>
                    <p>
                        The machine will use the Stud-finder Sensor to determine
                        the precise position of your tool rack.
                        <b>Keep your hands near the E-stop</b> and click “Find
                        Rack” to start. Expect the process to take a few
                        minutes.
                    </p>
                    <StepActionButton
                        label="Find Rack"
                        runningLabel="Finding..."
                        onApply={handleUseUtility}
                        isComplete={isComplete}
                        error={error}
                    />
                </>
            )}

            {rackPositionMethod === 'manual' && (
                <>
                    <p>
                        <b>
                            It is recommended that you use the provided utility.
                        </b>
                    </p>
                    <p>
                        Position the spindle until the tool-stud sensor is
                        almost touching the left-most tool-stud, as in the
                        provided image. The LED on the sensor should light up.
                    </p>
                    <p>
                        Once you are happy with the position, use the “Set
                        Position” button to set your rack position.
                    </p>
                    <PositionSetter
                        showZ={true}
                        xPosition={position.x}
                        yPosition={position.y}
                        zPosition={position.z}
                        onPositionChange={(positions) => {
                            console.log(positions);
                            setPosition(positions);
                        }}
                        actionButton={
                            <StepActionButton
                                label="Set Position"
                                runningLabel="Setting..."
                                onApply={setPositionViaPositionSetting}
                                isComplete={isComplete}
                                error={error}
                            />
                        }
                    />
                </>
            )}
        </div>
    );
}
