import { usePostHog } from '@posthog/react';
import zLabels from 'app/features/Jogging/assets/zLabels.svg';
import TabJog from 'app/features/Jogging/components/TabJog.tsx';
import {
    continuousJogAxis,
    type JoggerProps,
    stopContinuousJog,
    zMinusJog,
    zPlusJog,
} from 'app/features/Jogging/utils/Jogging.ts';
import { useLongPress } from 'use-long-press';

export function ZJog({
    feedrate,
    distance,
    canClick,
    threshold = 200,
}: JoggerProps) {
    const posthog = usePostHog();

    const zPlusJogHandlers = useLongPress(
        () => {
            continuousJogAxis({ Z: 1 }, feedrate);
            posthog?.capture('jog_z_plus', {
                distance,
                feedrate,
                continuous: true,
            });
        },
        {
            threshold,
            onCancel: () => {
                zPlusJog(distance, feedrate, false);
                posthog?.capture('jog_z_plus', {
                    distance,
                    feedrate,
                    continuous: false,
                });
            },
            onFinish: stopContinuousJog,
        },
    )();
    const zMinusJogHandlers = useLongPress(
        () => {
            continuousJogAxis({ Z: -1 }, feedrate);
            posthog?.capture('jog_z_minus', {
                distance,
                feedrate,
                continuous: true,
            });
        },
        {
            threshold,
            onCancel: () => {
                zMinusJog(distance, feedrate, false);
                posthog?.capture('jog_z_minus', {
                    distance,
                    feedrate,
                    continuous: false,
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
            id="zJog"
            className="relative w-[45px] portrait:w-[52px] h-[168px] portrait:h-[195px]"
        >
            <TabJog
                topHandlers={zPlusJogHandlers}
                bottomHandlers={zMinusJogHandlers}
                canClick={canClick}
                idForTest="Z"
                topLabel="Jog Z plus"
                bottomLabel="Jog Z minus"
                onTopKeyDown={(e) => handleKeyDown(e, zPlusJog)}
                onBottomKeyDown={(e) => handleKeyDown(e, zMinusJog)}
            />
            <img
                src={zLabels}
                alt="Z Labels tab"
                className="absolute top-0 left-0 pointer-events-none w-full h-full"
            />
        </div>
    );
}
