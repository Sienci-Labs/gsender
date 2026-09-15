import { usePostHog } from '@posthog/react';
import aLabels from 'app/features/Jogging/assets/aLabels.svg';
import TabJog from 'app/features/Jogging/components/TabJog.tsx';
import {
    aMinusJog,
    aPlusJog,
    continuousJogAxis,
    type JoggerProps,
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
    const posthog = usePostHog();

    const axis = isRotaryMode ? 'Y' : 'A';

    const aPlusJogHandlers = useLongPress(
        () => {
            continuousJogAxis({ [axis]: 1 }, feedrate);
            posthog?.capture('jog_a_plus', {
                distance,
                feedrate,
                continuous: true,
                isRotaryMode,
            });
        },
        {
            threshold,
            onCancel: () => {
                aPlusJog(distance, feedrate, false);
                posthog?.capture('jog_a_plus', {
                    distance,
                    feedrate,
                    continuous: false,
                    isRotaryMode,
                });
            },
            onFinish: stopContinuousJog,
        },
    )();
    const aMinusJogHandlers = useLongPress(
        () => {
            continuousJogAxis({ [axis]: -1 }, feedrate);
            posthog?.capture('jog_a_minus', {
                distance,
                feedrate,
                continuous: true,
                isRotaryMode,
            });
        },
        {
            threshold,
            onCancel: () => {
                aMinusJog(distance, feedrate, false);
                posthog?.capture('jog_a_minus', {
                    distance,
                    feedrate,
                    continuous: false,
                    isRotaryMode,
                });
            },
            onFinish: stopContinuousJog,
        },
    )();

    const handleKeyDown = (
        e: React.KeyboardEvent,
        action: (
            distance: number,
            feedrate: number,
            isContinuous: boolean,
        ) => void,
    ) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action(distance, feedrate, false);
        }
    };

    return (
        <div
            id="aJog"
            className="relative w-[45px] portrait:w-[52px] h-[168px] portrait:h-[195px]"
        >
            <TabJog
                topHandlers={aPlusJogHandlers}
                bottomHandlers={aMinusJogHandlers}
                canClick={canClick}
                idForTest="A"
                topLabel={`Jog ${axis} plus`}
                bottomLabel={`Jog ${axis} minus`}
                onTopKeyDown={(e) => handleKeyDown(e, aPlusJog)}
                onBottomKeyDown={(e) => handleKeyDown(e, aMinusJog)}
            />
            <img
                src={aLabels}
                alt="a Labels tab"
                className="absolute top-0 right-0 pointer-events-none w-full h-full object-contain"
            />
        </div>
    );
}
