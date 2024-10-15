import jogWheeelLabels from './assets/labels.svg';
import jogTab from './assets/tabs.svg';
import zLabels from './assets/zlabels.svg';
import aLabels from './assets/aLabels.svg';
import { JogInput } from 'app/features/Jogging/components/JogInput.tsx';
import { JogWheel } from 'app/features/Jogging/components/JogWheel.tsx';
import { useState, useEffect } from 'react';
import { SpeedSelector } from 'app/features/Jogging/components/SpeedSelector.tsx';
import { ZJog } from 'app/features/Jogging/components/ZJog.tsx';
import { AJog } from 'app/features/Jogging/components/AJog.tsx';
import store from 'app/store';
import get from 'lodash/get';

export interface JogValueObject {
    xyStep: number;
    aStep: number;
    zStep: number;
    feedrate: number;
}

export function Jogging() {
    const [jogSpeed, setJogSpeed] = useState<JogValueObject>({
        xyStep: 0,
        zStep: 0,
        aStep: 0,
        feedrate: 0,
    });

    useEffect(() => {
        const jogValues = store.get('widgets.axes.jog.normal', {});

        setJogSpeed({
            ...jogValues,
        });
    }, []);

    function updateJogValues(values: JogValueObject) {
        console.log(values);
        // Do converting if needed here
        setJogSpeed(values);
    }

    return (
        <>
            <div className="mt-4 flex flex-row w-full gap-2 justify-between items-center select-none">
                <div className="min-w-[200px] relative">
                    <JogWheel
                        distance={jogSpeed.xyStep}
                        feedrate={jogSpeed.feedrate}
                    />
                    <img
                        className="absolute top-0 left-0 pointer-events-none"
                        src={jogWheeelLabels}
                        alt="Jog wheel arrows"
                    />
                </div>
                <ZJog distance={jogSpeed.zStep} feedrate={jogSpeed.feedrate} />
                <AJog distance={jogSpeed.aStep} feedrate={jogSpeed.feedrate} />
            </div>
            <div className="flex flex-row justify-between flex-shrink">
                <div className="grid grid-cols-2 gap-1">
                    <JogInput label="XY" currentValue={jogSpeed.xyStep} />
                    <JogInput label="Z" currentValue={jogSpeed.zStep} />
                    <JogInput label="at" currentValue={jogSpeed.feedrate} />
                    <JogInput label="A°" currentValue={jogSpeed.aStep} />
                </div>
                <SpeedSelector onClick={updateJogValues} />
            </div>
        </>
    );
}
