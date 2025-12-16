import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { useState } from 'react';

export function RackPosition({ onComplete, onUncomplete }: StepProps) {
    const [rackPositionMethod, setRackPositionMethod] =
        useState<string>('utility');

    const applySettings = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
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
                </>
            )}

            <StepActionButton
                label="Probe Rack"
                runningLabel="Probing..."
                onApply={applySettings}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
            />
        </div>
    );
}
