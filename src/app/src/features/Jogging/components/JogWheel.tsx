import { useLongPress } from 'use-long-press';
import cn from 'classnames';

import {
    stopContinuousJog,
    xPlusJog,
    yPlusJog,
    xMinusJog,
    yMinusJog,
    continuousJogAxis,
    xPlusYMinus,
    xPlusYPlus,
    xMinusYMinus,
    xMinusYPlus,
} from 'app/features/Jogging/utils/Jogging.ts';
export interface JogWheelProps {
    canClick?: boolean;
    feedrate: number;
    distance: number;
}

export function JogWheel({ distance, feedrate, canClick }: JogWheelProps) {
    const xPlusJogHandlers = useLongPress(
        () => continuousJogAxis({ X: 1 }, feedrate),
        {
            threshold: 200,
            onCancel: () => xPlusJog(distance, feedrate, false),
            onFinish: stopContinuousJog,
        },
    )();
    const xMinusJogHandlers = useLongPress(() => xMinusJog(1, feedrate, true), {
        threshold: 200,
        onCancel: () => xMinusJog(distance, feedrate, false),
        onFinish: stopContinuousJog,
    })();

    const yPlusJogHandlers = useLongPress(() => yPlusJog(1, feedrate, true), {
        threshold: 200,
        onCancel: () => yPlusJog(distance, feedrate, false),
        onFinish: stopContinuousJog,
    })();
    const yMinusJogHandlers = useLongPress(() => yMinusJog(1, feedrate, true), {
        threshold: 200,
        onCancel: () => yMinusJog(distance, feedrate, false),
        onFinish: stopContinuousJog,
    })();

    const xPlusYMinusHandlers = useLongPress(
        () => continuousJogAxis({ X: 1, Y: -1 }, feedrate),
        {
            threshold: 200,
            onCancel: () => xPlusYMinus(distance, feedrate, false),
            onFinish: stopContinuousJog,
        },
    )();
    const xPlusYPlusHandlers = useLongPress(
        () => continuousJogAxis({ X: 1, Y: 1 }, feedrate),
        {
            threshold: 200,
            onCancel: () => xPlusYPlus(distance, feedrate, false),
            onFinish: stopContinuousJog,
        },
    )();

    const xMinusYPlusHandlers = useLongPress(
        () => continuousJogAxis({ X: -1, Y: 1 }, feedrate),
        {
            threshold: 200,
            onCancel: () => xMinusYPlus(distance, feedrate, false),
            onFinish: stopContinuousJog,
        },
    )();
    const xMinusYMinusHandlers = useLongPress(
        () => continuousJogAxis({ X: -1, Y: -1 }, feedrate),
        {
            threshold: 200,
            onCancel: () => xMinusYMinus(distance, feedrate, false),
            onFinish: stopContinuousJog,
        },
    )();

    const standardColourClass = 'fill-blue-500 hover:fill-blue-600 active:fill-blue-700';
    const altColourClass = 'fill-robin-500 hover:fill-blue-400 active:fill-robin-700';
    const disabledColorClass = 'fill-gray-400 hover:fill-gray-400';

    return (
        <svg
            width={180}
            height={180}
            viewBox="0 0 200 200"
            fill="none"
            className="hover:transition-all duration-200 cursor-pointer"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                id="xPlusYMinus"
                d="M180.191 140.859C171.562 157.794 157.794 171.562 140.859 180.191L100 100L180.191 140.859Z"
                className={cn(canClick ? altColourClass : disabledColorClass)}
                {...xPlusYMinusHandlers}
            />
            <path
                id="xMinusYMinus"
                d="M59.1408 180.191C42.2063 171.562 28.438 157.794 19.8094 140.859L100 100L59.1408 180.191Z"
                className={cn(canClick ? altColourClass : disabledColorClass)}
                {...xMinusYMinusHandlers}
            />
            <path
                id="xMinusYPlus"
                d="M19.8094 59.1409C28.438 42.2063 42.2063 28.438 59.1408 19.8094L100 100L19.8094 59.1409Z"
                className={cn(canClick ? altColourClass : disabledColorClass)}
                {...xMinusYPlusHandlers}
            />
            <path
                id="xPlusYPlus"
                d="M140.859 19.8094C157.794 28.438 171.562 42.2063 180.191 59.1409L100 100L140.859 19.8094Z"
                className={cn(canClick ? altColourClass : disabledColorClass)}
                {...xPlusYPlusHandlers}
            />
            <path
                id="yMinus"
                d="M138.268 192.388C126.136 197.413 113.132 200 100 200C86.8678 200 73.8642 197.413 61.7316 192.388L100 100L138.268 192.388Z"
                fill="#3F85C7"
                className={cn(
                    canClick ? standardColourClass : disabledColorClass,
                )}
                {...yMinusJogHandlers}
            />
            <path
                id="xMinus"
                d="M7.61205 138.268C2.58658 126.136 -1.14805e-06 113.132 0 100C1.14805e-06 86.8678 2.58658 73.8642 7.61206 61.7316L100 100L7.61205 138.268Z"
                fill="#3F85C7"
                className={cn(
                    canClick ? standardColourClass : disabledColorClass,
                )}
                {...xMinusJogHandlers}
            />
            <path
                id="yPlus"
                d="M61.7316 7.61205C73.8642 2.58658 86.8678 -1.566e-07 100 0C113.132 1.566e-07 126.136 2.58658 138.268 7.61205L100 100L61.7316 7.61205Z"
                fill="#3F85C7"
                className={cn(
                    canClick ? standardColourClass : disabledColorClass,
                )}
                {...yPlusJogHandlers}
            />
            <path
                id="xPlus"
                d="M192.388 61.7317C197.413 73.8642 200 86.8678 200 100C200 113.132 197.413 126.136 192.388 138.268L100 100L192.388 61.7317Z"
                fill="#3F85C7"
                className={cn(
                    canClick ? standardColourClass : disabledColorClass,
                )}
                {...xPlusJogHandlers}
            />
            <circle cx={99.9168} cy={100.415} r={38.5} fill="#F4F4F4" />
        </svg>
    );
}
