import jogWheel from './assets/wheel.svg';
import jogWheeelLabels from './assets/labels.svg';
import jogTab from './assets/tabs.svg';
import zLabels from './assets/zlabels.svg';
import aLabels from './assets/aLabels.svg';
import { JogInput } from 'app/features/Jogging/components/JogInput.tsx';

export function Jogging() {
    return (
        <>
            <div className="mt-4 flex flex-row w-full gap-2 justify-between items-center select-none">
                <div className="min-w-[200px] relative">
                    <img className="" src={jogWheel} alt="Jog wheel" />
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
                    <JogInput label="XY" currentValue={10} />
                    <JogInput label="Z" currentValue={5} />
                    <JogInput label="at" currentValue={5000} />
                    <JogInput label="A°" currentValue={10} />
                </div>
                <div>Selector</div>
            </div>
        </>
    );
}