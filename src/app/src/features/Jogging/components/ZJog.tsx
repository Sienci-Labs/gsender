import zLabels from 'app/features/Jogging/assets/zLabels.svg';
import TabJog from 'app/features/Jogging/components/TabJog.tsx';
import {
    continuousJogAxis,
    JoggerProps,
    stopContinuousJog,
    zMinusJog,
    zPlusJog,
} from 'app/features/Jogging/utils/Jogging.ts';
import { useLongPress } from 'use-long-press';

export function ZJog({ feedrate, distance, canClick }: JoggerProps) {
    const zPlusJogHandlers = useLongPress(
        () => continuousJogAxis({ Z: 1 }, feedrate),
        {
            threshold: 200,
            onCancel: () => zPlusJog(distance, feedrate, false),
            onFinish: stopContinuousJog,
        },
    )();
    const zMinusJogHandlers = useLongPress(
        () => continuousJogAxis({ Z: -1 }, feedrate),
        {
            threshold: 200,
            onCancel: () => zMinusJog(distance, feedrate, false),
            onFinish: stopContinuousJog,
        },
    )();

    return (
        <div id="zJog" className="relative">
            <TabJog
                topHandlers={zPlusJogHandlers}
                bottomHandlers={zMinusJogHandlers}
                canClick={canClick}
            />
            <img
                src={zLabels}
                alt="Z Labels tab"
                className="absolute top-0 left-0 pointer-events-none"
            />
        </div>
    );
}
