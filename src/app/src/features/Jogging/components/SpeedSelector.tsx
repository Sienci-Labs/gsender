import { useEffect, useState, useRef } from 'react';
import cn from 'classnames';
import pubsub from 'pubsub-js';
import get from 'lodash/get';

import { JoggingSpeedOptions } from 'app/features/Jogging/utils/Jogging';
import store from 'app/store';
import { JogValueObject } from 'app/features/Jogging';
import { IMPERIAL_UNITS, JOGGING_CATEGORY, METRIC_UNITS } from 'app/constants';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

import { convertValue } from '../utils/units';

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
            className={cn('text-sm px-2 max-xl:px-1 max-xl:py-1 py-2 rounded', {
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
    const handleClickRef = useRef(handleClick);
    const { units } = useWorkspaceState();
    const previousUnitsRef = useRef(units);

    // Update the ref when handleClick changes
    useEffect(() => {
        handleClickRef.current = handleClick;
    }, [handleClick]);

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
        const newSpeeds = { ...get(jogValues, key, {}) };

        // Only convert if the units have changed or we've selected a different speed
        if (units === IMPERIAL_UNITS && !jogValues.storedInMetric) {
            // Convert metric values to imperial for display
            newSpeeds.xyStep = convertValue(
                newSpeeds.xyStep,
                METRIC_UNITS,
                IMPERIAL_UNITS,
            );
            newSpeeds.zStep = convertValue(
                newSpeeds.zStep,
                METRIC_UNITS,
                IMPERIAL_UNITS,
            );
            newSpeeds.feedrate = convertValue(
                newSpeeds.feedrate,
                METRIC_UNITS,
                IMPERIAL_UNITS,
            );
        }

        handleClickRef.current(newSpeeds);
        previousUnitsRef.current = units;
    }

    // Any time the value swaps, fetch and update the parent
    useEffect(() => {
        // get speed, convert units, update UI
        updateCurrentJogValues();

        const token = pubsub.subscribe('config:saved', updateCurrentJogValues);

        return () => {
            pubsub.unsubscribe(token);
        };
    }, [selectedSpeed, units]);

    const shuttleControlEvents = {
        SET_R_JOG_PRESET: {
            title: 'Set to Rapid Preset',
            keys: ['shift', 'v'].join('+'),
            cmd: 'SET_R_JOG_PRESET',
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: () => handleSpeedChange('Rapid'),
        },
        SET_N_JOG_PRESET: {
            title: 'Set to Normal Preset',
            keys: ['shift', 'c'].join('+'),
            cmd: 'SET_N_JOG_PRESET',
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: () => handleSpeedChange('Normal'),
        },
        SET_P_JOG_PRESET: {
            title: 'Set to Precise Preset',
            keys: ['shift', 'x'].join('+'),
            cmd: 'SET_P_JOG_PRESET',
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: () => handleSpeedChange('Precise'),
        },
        CYCLE_JOG_PRESETS: {
            title: 'Switch between Presets',
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
        <div className="flex flex-col bg-white dark:bg-dark dark:text-white rounded-md border-solid border border-gray-300 dark:border-gray-700 p-1 w-32 max-xl:w-28">
            <SpeedSelectButton
                active={preciseActive}
                onClick={() => handleSpeedChange('Precise')}
                label="Precise"
            />
            <SpeedSelectButton
                active={normalActive}
                onClick={() => handleSpeedChange('Normal')}
                label="Normal"
            />
            <SpeedSelectButton
                active={rapidActive}
                onClick={() => handleSpeedChange('Rapid')}
                label="Rapid"
            />
        </div>
    );
}
