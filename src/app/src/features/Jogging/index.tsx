import jogWheeelLabels from './assets/labels.svg';
import jogTab from './assets/tabs.svg';
import zLabels from './assets/zlabels.svg';
import aLabels from './assets/aLabels.svg';
import { JogInput } from 'app/features/Jogging/components/JogInput.tsx';
import { Tabs, TabsList, TabsTrigger } from 'app/components/shadcn/Tabs.tsx';
import { JogWheel } from 'app/features/Jogging/components/JogWheel.tsx';
import { useState, useEffect } from 'react';

export function Jogging() {
    const [jogSpeed, setJogSpeed] = useState({
        xyStep: 0,
        zStep: 0,
        aStep: 0,
        feedrate: 0,
    });

    useEffect(() => {
        setJogSpeed({
            xyStep: 5000,
            zStep: 1000,
            aStep: 5000,
            feedrate: 10000,
        });
    }, []);

    return (
        <>
            <div className="mt-4 flex flex-row w-full gap-2 justify-between items-center select-none">
                <div className="min-w-[200px] relative">
                    <JogWheel />
                    <img
                        className="absolute top-0 left-0 pointer-events-none"
                        src={jogWheeelLabels}
                        alt="Jog wheel arrows"
                    />
                </div>
                <div id="zJog" className="relative">
                    <img src={jogTab} alt="Z jog tab" />
                    <img
                        src={zLabels}
                        alt="Z jog labels"
                        className="absolute top-0 left-0 pointer-events-none"
                    />
                </div>
                <div id="aJog" className="relative">
                    <img src={jogTab} alt="A Jog tab" />
                    <img
                        src={aLabels}
                        alt="A Labels tab"
                        className="absolute top-1 right-1 pointer-events-none"
                    />
                </div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="grid grid-cols-2 gap-1">
                    <JogInput label="XY" currentValue={jogSpeed.xyStep} />
                    <JogInput label="Z" currentValue={jogSpeed.zStep} />
                    <JogInput label="at" currentValue={jogSpeed.feedrate} />
                    <JogInput label="A°" currentValue={jogSpeed.aStep} />
                </div>

                <Tabs
                    defaultValue="rapid"
                    orientation="vertical"
                    aria-orientation="vertical"
                    className="border border-gray-200 bg-white rounded"
                >
                    <TabsList className="flex flex-col text-gray-500 bg-blue-50 ">
                        <TabsTrigger value="rapid">Rapid</TabsTrigger>
                        <TabsTrigger value="normal">Normal</TabsTrigger>
                        <TabsTrigger value="precide">Precise</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        </>
    );
}
