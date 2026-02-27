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

    const handleKeyDown = (
        e: React.KeyboardEvent,
        action: (distance: number, feedrate: number, isContinuous: boolean) => void,
    ) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action(distance, feedrate, false);
        }
    };

    return (
        <div id="aJog" className="relative">
            <TabJog
                topHandlers={aPlusJogHandlers}
                bottomHandlers={aMinusJogHandlers}
                canClick={canClick}
                topLabel={`Jog ${axis} plus`}
                bottomLabel={`Jog ${axis} minus`}
                onTopKeyDown={(e) => handleKeyDown(e, aPlusJog)}
                onBottomKeyDown={(e) => handleKeyDown(e, aMinusJog)}
            />
            <img
                src={aLabels}
                alt="a Labels tab"
                className="absolute top-1 right-1 pointer-events-none"
            />
        </div>
    );
}
