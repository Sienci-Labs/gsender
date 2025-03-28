import cn from 'classnames';
import { useEffect, useState } from 'react';
import { JoggingSpeedOptions } from 'app/features/Jogging/utils/Jogging.ts';
import store from 'app/store';
import get from 'lodash/get';
import { JogValueObject } from 'app/features/Jogging';
import { useRegisterShortcuts } from 'app/features/Keyboard/useRegisterShortcuts';
import pubsub from 'pubsub-js';

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
            className={cn('text-sm px-2 py-2 rounded', {
                'bg-blue-400 bg-opacity-30': active,
            })}
            onClick={onClick}
        >
            {label}
        </button>
    );
}

interface SpeedSelectorProps {
    handleClick: (values: JogValueObject, speed: JoggingSpeedOptions) => void;
}

export function SpeedSelector({ handleClick }: SpeedSelectorProps) {
    const [selectedSpeed, setSelectedSpeed] =
        useState<JoggingSpeedOptions>('Normal');

    useRegisterShortcuts([
        {
            id: 'jog-speed-rapid-select',
            title: 'Select Rapid Speed',
            description: 'Select Rapid speed',
            defaultKeys: 'shift+v',
            category: 'JOGGING_CATEGORY',
            onKeyDown: () => {
                setSelectedSpeed('Rapid');
            },
        },
        {
            id: 'jog-speed-normal-select',
            title: 'Select Normal Speed',
            description: 'Select Normal speed',
            defaultKeys: 'shift+c',
            category: 'JOGGING_CATEGORY',
            onKeyDown: () => {
                setSelectedSpeed('Normal');
            },
        },
        {
            id: 'jog-speed-precise-select',
            title: 'Select Precise Speed',
            description: 'Select Precise speed',
            defaultKeys: 'shift+x',
            category: 'JOGGING_CATEGORY',
            onKeyDown: () => {
                setSelectedSpeed('Precise');
            },
        },
        {
            id: 'jog-speed-cycle',
            title: 'Cycle Speed',
            description: 'Cycle through speeds',
            defaultKeys: 'shift+z',
            category: 'JOGGING_CATEGORY',
            onKeyDown: () => {
                const presets = [
                    'Rapid',
                    'Normal',
                    'Precise',
                ] as JoggingSpeedOptions[];
                const nextIndex =
                    presets.findIndex((preset) => preset === selectedSpeed) + 1;
                const key = presets[nextIndex]
                    ? presets[nextIndex]
                    : presets[0];

                setSelectedSpeed(key);
            },
        },
    ]);

    const rapidActive = selectedSpeed === 'Rapid';
    const normalActive = selectedSpeed === 'Normal';
    const preciseActive = selectedSpeed === 'Precise';

    function handleSpeedClick(speed: JoggingSpeedOptions) {
        // save old values to config
        setSelectedSpeed(speed);
    }

    function updateCurrentJogValues() {
        const jogValues = store.get('widgets.axes.jog', {});
        const key = selectedSpeed.toLowerCase();
        const newSpeeds = get(jogValues, key, {});
        handleClick(newSpeeds, selectedSpeed);
    }

    // Any time the value swaps, fetch and update the parent
    useEffect(() => {
        // get speed, convert units, update UI
        updateCurrentJogValues();

        const token = pubsub.subscribe('config:saved', updateCurrentJogValues);

        return () => {
            pubsub.unsubscribe(token);
        };
    }, [selectedSpeed]);

    return (
        <div className="flex flex-col bg-white dark:bg-dark dark:text-white rounded-md border-solid border border-gray-300 dark:border-gray-700 p-1 w-32">
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
