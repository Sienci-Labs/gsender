import aLabels from 'app/features/Jogging/assets/aLabels.svg';
import TabJog from 'app/features/Jogging/components/TabJog.tsx';
import {
    aMinusJog,
    aPlusJog,
    continuousJogAxis,
    JoggerProps,
    stopContinuousJog,
} from 'app/features/Jogging/utils/Jogging.ts';
import { useLongPress } from 'use-long-press';

export function AJog({
    feedrate,
    distance,
    canClick,
    isRotaryMode,
    threshold = 200,
}: JoggerProps) {
    const axis = isRotaryMode ? 'Y' : 'A';

    const aPlusJogHandlers = useLongPress(
        () => continuousJogAxis({ [axis]: 1 }, feedrate),
        {
            threshold,
            onCancel: () => aPlusJog(distance, feedrate, false),
            onFinish: stopContinuousJog,
        },
    )();
    const aMinusJogHandlers = useLongPress(
        () => continuousJogAxis({ [axis]: -1 }, feedrate),
        {
            threshold,
            onCancel: () => aMinusJog(distance, feedrate, false),
            onFinish: stopContinuousJog,
        },
    )();

    return (
        <div id="aJog" className="relative w-[45px] portrait:w-[52px] h-[168px] portrait:h-[195px]">
            <TabJog
                topHandlers={aPlusJogHandlers}
                bottomHandlers={aMinusJogHandlers}
                canClick={canClick}
            />
            <img
                src={aLabels}
                alt="a Labels tab"
                className="absolute top-1 right-1 pointer-events-none w-full h-full object-contain"
            />
        </div>
    );
}
