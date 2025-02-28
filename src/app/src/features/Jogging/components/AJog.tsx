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

export function AJog({ feedrate, distance, canClick }: JoggerProps) {
    const aPlusJogHandlers = useLongPress(
        () => continuousJogAxis({ A: 1 }, feedrate),
        {
            threshold: 200,
            onCancel: () => aPlusJog(distance, feedrate, false),
            onFinish: stopContinuousJog,
        },
    )();
    const aMinusJogHandlers = useLongPress(
        () => continuousJogAxis({ A: -1 }, feedrate),
        {
            threshold: 200,
            onCancel: () => aMinusJog(distance, feedrate, false),
            onFinish: stopContinuousJog,
        },
    )();

    return (
        <div id="aJog" className="relative">
            <TabJog
                topHandlers={aPlusJogHandlers}
                bottomHandlers={aMinusJogHandlers}
                canClick={canClick}
            />
            <img
                src={aLabels}
                alt="a Labels tab"
                className="absolute top-1 right-1 pointer-events-none"
            />
        </div>
    );
}
