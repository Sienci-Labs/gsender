import cn from 'classnames';
import { useEffect, useState } from 'react';
import { JoggingSpeedOptions } from 'app/features/Jogging/utils/Jogging.ts';
import store from 'app/store';
import get from 'lodash/get';
import { JogValueObject } from 'app/features/Jogging';

export interface SpeedSelectButtonProps {
    active?: boolean;
    onClick?: () => void;
    label: string;
}

export function SpeedSelectButton({
    label,
    active,
    onClick,
}: SpeedSelectButtonProps) {
    return (
        <button
            className={cn('text-sm px-2 py-1 rounded', {
                'bg-blue-400 bg-opacity-30': active,
            })}
            onClick={onClick}
        >
            {label}
        </button>
    );
}

interface SpeedSelectorProps {
    onClick?: (values: JogValueObject) => void;
}

export function SpeedSelector({ onClick }: SpeedSelectorProps) {
    const [selectedSpeed, setSelectedSpeed] =
        useState<JoggingSpeedOptions>('Normal');

    const rapidActive = selectedSpeed === 'Rapid';
    const normalActive = selectedSpeed === 'Normal';
    const preciseActive = selectedSpeed === 'Precise';

    function handleSpeedClick(speed: JoggingSpeedOptions) {
        setSelectedSpeed(speed);
    }

    // Any time the value swaps, fetch and update the parent
    useEffect(() => {
        // get speed, convert units, update UI
        const jogValues = store.get('widgets.axes.jog', {});
        const key = selectedSpeed.toLowerCase();
        const newSpeeds = get(jogValues, key, {});
        onClick(newSpeeds);
    }, [selectedSpeed]);

    return (
        <div className="flex flex-col bg-white rounded-md border-solid border border-gray-300 p-[2px]`">
            <SpeedSelectButton
                active={rapidActive}
                onClick={() => handleSpeedClick('Rapid')}
                label="Rapid"
            />

            <SpeedSelectButton
                active={normalActive}
                onClick={() => handleSpeedClick('Normal')}
                label="Normal"
            />

            <SpeedSelectButton
                active={preciseActive}
                onClick={() => handleSpeedClick('Precise')}
                label="Precise"
            />
        </div>
    );
}
