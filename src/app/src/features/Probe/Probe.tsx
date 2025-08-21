/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import React, { useCallback, useRef, useEffect } from 'react';
import cx from 'classnames';

import { Button as ShadcnButton } from 'app/components/shadcn/Button';
import { Button } from 'app/components/Button';

import { METRIC_UNITS, PROBING_CATEGORY } from '../../constants';
import ProbeImage from './ProbeImage';
import ProbeDiameter from './ProbeDiameter';
import ProbeDirectionSelection from './ProbeDirectionSelection';
import { Actions, State } from './definitions';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';

type ProbeProps = {
    state: State;
    actions: Actions;
};

const Probe = ({ state, actions }: ProbeProps) => {
    // Use a ref to always have access to the latest state
    const stateRef = useRef(state);
    const actionsRef = useRef(actions);

    // Update the refs when state or actions change
    useEffect(() => {
        stateRef.current = state;
        actionsRef.current = actions;
    }, [state, actions]);

    // Create stable callbacks that always access the latest state via the ref
    const toggleProbeDialog = useCallback(() => {
        const { show } = stateRef.current;
        actionsRef.current.onOpenChange(!show);
    }, []);

    const probeRoutineScrollRight = useCallback(() => {
        const { availableProbeCommands, selectedProbeCommand } =
            stateRef.current;
        let newIndex = selectedProbeCommand + 1;
        if (availableProbeCommands.length <= newIndex) {
            newIndex = 0;
        }
        actionsRef.current.handleProbeCommandChange(newIndex);
    }, []);

    const probeRoutineScrollLeft = useCallback(() => {
        const { availableProbeCommands, selectedProbeCommand } =
            stateRef.current;
        let newIndex = selectedProbeCommand - 1;
        if (newIndex < 0) {
            newIndex = availableProbeCommands.length - 1;
        }
        actionsRef.current.handleProbeCommandChange(newIndex);
    }, []);

    const shuttleControlEvents = {
        OPEN_PROBE: {
            title: 'Display probe popup',
            keys: '',
            cmd: 'OPEN_PROBE',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: toggleProbeDialog,
        },
        PROBE_ROUTINE_SCROLL_RIGHT: {
            title: 'Probe Routine scroll right',
            keys: '',
            cmd: 'PROBE_ROUTINE_SCROLL_RIGHT',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: probeRoutineScrollRight,
        },
        PROBE_ROUTINE_SCROLL_LEFT: {
            title: 'Probe Routine scroll left',
            keys: '',
            cmd: 'PROBE_ROUTINE_SCROLL_LEFT',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: probeRoutineScrollLeft,
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    const {
        canClick,
        availableProbeCommands,
        selectedProbeCommand,
        touchplate,
        direction,
    } = state;

    const { touchplateType } = touchplate;
    const probeCommand = availableProbeCommands[selectedProbeCommand];

    return (
        <div className="w-full h-full">
            <div className="grid grid-cols-[5fr_3fr] w-full h-full">
                {/* <div className="w-full h-full m-auto grid gap-4">
                    <div className="h-full grid grid-rows[4fr_2fr] self-center gap-2"> */}
                <div className="grid grid-rows-[1fr_1fr_1fr] gap-2 items-center justify-center">
                    <div className="flex w-full bg-white dark:bg-dark rounded-md border-solid border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 p-[2px]">
                        {availableProbeCommands.map((command, index) => (
                            <ShadcnButton
                                key={command.id}
                                onClick={() =>
                                    actions.handleProbeCommandChange(index)
                                }
                                size="icon"
                                className={cx(
                                    'rounded-md relative h-[calc(4vh+3px)]',
                                    {
                                        'bg-blue-400 bg-opacity-30':
                                            index === selectedProbeCommand,
                                    },
                                )}
                            >
                                {command.id.split(' ')[0]}
                            </ShadcnButton>
                        ))}
                    </div>
                    <div
                        className={cx('flex items-center', {
                            hidden: !probeCommand?.tool,
                        })}
                    >
                        <ProbeDiameter
                            actions={actions}
                            state={state}
                            probeCommand={probeCommand}
                        />
                    </div>
                    <div className="flex items-center justify-center">
                        <Button
                            onClick={() => actions.onOpenChange(true)}
                            disabled={!canClick}
                        >
                            Probe
                        </Button>
                    </div>
                </div>
                <div className="flex w-full h-full min-h-full">
                    <ProbeImage
                        touchplateType={touchplateType}
                        probeCommand={probeCommand}
                    />
                </div>
            </div>
            <ProbeDirectionSelection
                direction={direction}
                onClick={actions.nextProbeDirection}
            />
        </div>
    );
};

export default Probe;
