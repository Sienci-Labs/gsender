import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { PositionSetter } from 'app/features/AccessoryInstaller/Wizards/atc/components/PositionSetter.tsx';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { useEffect, useState } from 'react';

export function TLSPosition({ onComplete, onUncomplete }: StepProps) {
    const applySettings = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
    };

    const mpos = useSelector((state: RootState) => state.controller.mpos);

    useEffect(() => {
        if (!mpos || !mpos.x || !mpos.y || !mpos.z) return;
        const { x, y, z } = mpos;
        setPosition({ x, y, z });
    }, [mpos]);

    const [position, setPosition] = useState({ x: '0', y: '0', z: '0' });

    const setPosition = () => {
        console.log('setting')
        setTimeout(() => {
            onComplete();
        }, 1500);
    }

    return (
        <div className="flex flex-col gap-5 p-2 justify-start">
            <p>
                Please jog until just above the Tool Length Sensor and set the
                position of your tool length sensor using the “Set Position”
                button.
            </p>
            <p>
                If you are setting up the TLS for the first time and do not have
                a tool in the spindle, you can align the TLS using the taper of
                the spindle as well.
            </p>
            <PositionSetter
                showZ={false}
                xPosition={position.x}
                yPosition={position.y}
                onPositionChange={(positions) => {
                    console.log(positions);
                }}
                actionButton={
                    <StepActionButton
                        label={'Set Position'}
                        runningLabel="Setting..."
                        onApply={setPosition}
                        isComplete={isComplete}
                        error={error}
                    />
                }
            />
        </div>
    );
}
