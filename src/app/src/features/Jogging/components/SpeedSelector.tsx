import cn from 'classnames';
import { useEffect, useState, useRef } from 'react';
import { JoggingSpeedOptions } from 'app/features/Jogging/utils/Jogging.ts';
import store from 'app/store';
import get from 'lodash/get';
import { JogValueObject } from 'app/features/Jogging';
import pubsub from 'pubsub-js';
import { JOGGING_CATEGORY } from 'app/constants';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';

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
    handleClick: (values: JogValueObject) => void;
}

export function SpeedSelector({ handleClick }: SpeedSelectorProps) {
    const [selectedSpeed, setSelectedSpeed] =
        useState<JoggingSpeedOptions>('Normal');
    const selectedSpeedRef = useRef<JoggingSpeedOptions>(selectedSpeed);

    const rapidActive = selectedSpeed === 'Rapid';
    const normalActive = selectedSpeed === 'Normal';
    const preciseActive = selectedSpeed === 'Precise';

    function handleSpeedChange(speed: JoggingSpeedOptions) {
        // save old values to config
        setSelectedSpeed(speed);
        selectedSpeedRef.current = speed;
    }

    function updateCurrentJogValues() {
        const jogValues = store.get('widgets.axes.jog', {});
        const key = selectedSpeed.toLowerCase();
        const newSpeeds = get(jogValues, key, {});
        handleClick(newSpeeds);
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

    const shuttleControlEvents = {
        SET_R_JOG_PRESET: {
            title: 'Select Rapid Jog Preset',
            keys: ['shift', 'v'].join('+'),
            cmd: 'SET_R_JOG_PRESET',
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: () => handleSpeedChange('Rapid'),
        },
        SET_N_JOG_PRESET: {
            title: 'Select Normal Jog Preset',
            keys: ['shift', 'c'].join('+'),
            cmd: 'SET_N_JOG_PRESET',
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: () => handleSpeedChange('Normal'),
        },
        SET_P_JOG_PRESET: {
            title: 'Select Precise Jog Preset',
            keys: ['shift', 'x'].join('+'),
            cmd: 'SET_P_JOG_PRESET',
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: () => handleSpeedChange('Precise'),
        },
        CYCLE_JOG_PRESETS: {
            title: 'Cycle Through Jog Presets',
            keys: ['shift', 'z'].join('+'),
            cmd: 'CYCLE_JOG_PRESETS',
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: () => {
                const jogSpeedOptionsList: JoggingSpeedOptions[] = [
                    'Rapid',
                    'Normal',
                    'Precise',
                ];

                const currentIndex = jogSpeedOptionsList.findIndex(
                    (option) => option === selectedSpeedRef.current,
                );
                const nextIndex = currentIndex + 1;
                const nextSpeed = jogSpeedOptionsList[nextIndex];

                handleSpeedChange(nextSpeed ?? jogSpeedOptionsList[0]);
            },
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    return (
        <div className="flex flex-col bg-white dark:bg-dark dark:text-white rounded-md border-solid border border-gray-300 dark:border-gray-700 p-1 w-32">
            <SpeedSelectButton
                active={rapidActive}
                onClick={() => handleSpeedChange('Rapid')}
                label="Rapid"
            />

            <SpeedSelectButton
                active={normalActive}
                onClick={() => handleSpeedChange('Normal')}
                label="Normal"
            />

            <SpeedSelectButton
                active={preciseActive}
                onClick={() => handleSpeedChange('Precise')}
                label="Precise"
            />
        </div>
    );
}
