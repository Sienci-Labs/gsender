import zLabels from 'app/features/Jogging/assets/zLabels.svg';
import TabJog from 'app/features/Jogging/components/TabJog.tsx';
import {
    aMinusJog,
    aPlusJog,
    continuousJogAxis,
    JoggerProps,
    stopContinuousJog,
    zMinusJog,
    zPlusJog,
} from 'app/features/Jogging/utils/Jogging.ts';
import { useLongPress } from 'use-long-press';

export function ZJog(props: JoggerProps) {
    const zPlusJogHandlers = useLongPress(
        () => continuousJogAxis({ Z: 1 }, props.feedrate),
        {
            threshold: 200,
            onCancel: () => zPlusJog(10, 5000, false),
            onFinish: stopContinuousJog,
        },
    );
    const zMinusJogHandlers = useLongPress(
        () => continuousJogAxis({ Z: -1 }, props.feedrate),
        {
            threshold: 200,
            onCancel: () => zMinusJog(10, 5000, false),
            onFinish: stopContinuousJog,
        },
    );

    return (
        <div id="zJog" className="relative">
            <TabJog
                topHandlers={zPlusJogHandlers}
                bottomHandlers={zMinusJogHandlers}
            />
            <img
                src={zLabels}
                alt="Z Labels tab"
                className="absolute top-0 left-0 pointer-events-none"
            />
        </div>
    );
}
