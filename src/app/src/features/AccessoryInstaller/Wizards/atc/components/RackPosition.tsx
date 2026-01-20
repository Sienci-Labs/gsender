import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { useEffect, useState } from 'react';
import { PositionSetter } from 'app/features/AccessoryInstaller/Wizards/atc/components/PositionSetter.tsx';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import controller from "app/lib/controller.ts";
import {useTypedSelector} from "app/hooks/useTypedSelector.ts";

export function RackPosition({ onComplete, onUncomplete }: StepProps) {
    const [rackPositionMethod, setRackPositionMethod] =
        useState<string>('utility');

    const mpos = useSelector((state: RootState) => state.controller.mpos);
    const rackPosition = useTypedSelector((state: RootState) => state.controller.settings.parameters['G59.1'])

    useEffect(() => {
        if (!mpos || !mpos.x || !mpos.y || !mpos.z) return;
        const { x, y, z } = mpos;
        setPosition({ x, y, z });
    }, [mpos]);

    const [position, setPosition] = useState({ x: '0', y: '0', z: '0' });

    const applySettings = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
    };

    const handleUseUtility = () => {
        controller.command('gcode', 'G65 P302');
    };

    const setPositionViaPositionSetting = () => {
        //ToDo
    };

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
                        almost touching the left-most tool-stud, as in the
                        provided image. The LED on the sensor should light up.
                    </p>
                    <p>
                        The machine will use the Stud-finder Sensor to determine
                        the precise position of your tool rack.{' '}
                        <b>Keep your hands near the E-stop</b> and click “Find
                        Rack” to start.
                    </p>
                    <StepActionButton
                        label="Find Rack"
                        runningLabel="Finding..."
                        onApply={applySettings}
                        onComplete={onComplete}
                        onUncomplete={onUncomplete}
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
                                onApply={applySettings}
                                onComplete={onComplete}
                                onUncomplete={onUncomplete}
                            />
                        }
                    />
                </>
            )}
        </div>
    );
}
