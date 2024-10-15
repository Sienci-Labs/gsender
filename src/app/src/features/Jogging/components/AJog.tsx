import aLabels from 'app/features/Jogging/assets/aLabels.svg';
import TabJog from 'app/features/Jogging/components/TabJog.tsx';
import {
    aMinusJog,
    aPlusJog,
    continuousJogAxis,
    JoggerProps,
    stopContinuousJog,
    xMinusJog,
    xPlusJog,
} from 'app/features/Jogging/utils/Jogging.ts';
import { useLongPress } from 'use-long-press';

export function AJog(props: JoggerProps) {
    const aPlusJogHandlers = useLongPress(
        () => continuousJogAxis({ A: 1 }, props.feedrate),
        {
            threshold: 200,
            onCancel: () => aPlusJog(10, 5000, false),
            onFinish: stopContinuousJog,
        },
    );
    const aMinusJogHandlers = useLongPress(
        () => continuousJogAxis({ A: -1 }, props.feedrate),
        {
            threshold: 200,
            onCancel: () => aMinusJog(10, 5000, false),
            onFinish: stopContinuousJog,
        },
    );

    return (
        <div id="aJog" className="relative">
            <TabJog
                topHandlers={aPlusJogHandlers}
                bottomHandlers={aMinusJogHandlers}
            />
            <img
                src={aLabels}
                alt="a Labels tab"
                className="absolute top-1 right-1 pointer-events-none"
            />
        </div>
    );
}
