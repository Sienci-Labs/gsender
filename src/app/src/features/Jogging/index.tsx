import jogWheeelLabels from './assets/labels.svg';
import { JogInput } from 'app/features/Jogging/components/JogInput.tsx';
import { JogWheel } from 'app/features/Jogging/components/JogWheel.tsx';
import { useState, useEffect } from 'react';
import { SpeedSelector } from 'app/features/Jogging/components/SpeedSelector.tsx';
import { ZJog } from 'app/features/Jogging/components/ZJog.tsx';
import { AJog } from 'app/features/Jogging/components/AJog.tsx';
import store from 'app/store';
import stopSign from './assets/stop.svg';
import { cancelJog } from 'app/features/Jogging/utils/Jogging.ts';
import {FirmwareFlavour} from "app/features/Connection";

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
    const [firmware, setFirmware] = useState<FirmwareFlavour>('Grbl');

    useEffect(() => {
        const jogValues = store.get('widgets.axes.jog.normal', {});
        const firmwareType = store.get('widgets.connection.controller.type', 'Grbl');
        setFirmware(firmwareType);
        setJogSpeed({
            ...jogValues,
        });
    }, []);

    function updateJogValues(values: JogValueObject) {
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
                    <img
                        src={stopSign}
                        className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2"
                        alt="E-Stop button"
                        onClick={cancelJog}
                    />
                </div>
                <ZJog distance={jogSpeed.zStep} feedrate={jogSpeed.feedrate} />
                <AJog distance={jogSpeed.aStep} feedrate={jogSpeed.feedrate} />
            </div>
            <div className="flex flex-row justify-around flex-shrink">
                <div className="grid grid-cols-2 gap-1">
                    <JogInput label="XY" currentValue={jogSpeed.xyStep} />
                    <JogInput label="Z" currentValue={jogSpeed.zStep} />
                    <JogInput label="at" currentValue={jogSpeed.feedrate} />
                    {
                        firmware === 'grblHAL' && <JogInput label="A°" currentValue={jogSpeed.aStep} />
                    }
                </div>
                <SpeedSelector onClick={updateJogValues} />
            </div>
        </>
    );
}
