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

import React, { useEffect } from 'react';
import cx from 'classnames';
import combokeys from 'app/lib/combokeys';
import gamepad, { runAction } from 'app/lib/gamepad';
import useKeybinding from '../../lib/useKeybinding';
import { METRIC_UNITS, PROBING_CATEGORY } from '../../constants';
import ProbeImage from './ProbeImage';
import ProbeDiameter from './ProbeDiameter';
import ProbeDirectionSelection from './ProbeDirectionSelection';
import {
    ShuttleControlEvents,
    ShuttleEvent,
} from 'app/lib/definitions/shortcuts';
import { Actions, State } from './definitions';
import { GamepadDetail } from 'app/lib/gamepad/definitions';
import { Button } from 'app/components/shadcn/Button';

interface Props {
    state: State;
    actions: Actions;
}

const Probe: React.FC<Props> = ({ state, actions }) => {
    const shuttleControlEvents: ShuttleControlEvents = {
        OPEN_PROBE: {
            title: 'Open Probe',
            keys: '',
            cmd: 'OPEN_PROBE',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                actions.onOpenChange(true);
            },
        },
        PROBE_ROUTINE_SCROLL_RIGHT: {
            title: 'Probe Routine Scroll Right',
            keys: '',
            cmd: 'PROBE_ROUTINE_SCROLL_RIGHT',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                const { availableProbeCommands, selectedProbeCommand } = state;

                let newIndex = selectedProbeCommand + 1;
                if (availableProbeCommands.length <= newIndex) {
                    newIndex = 0;
                }
                actions.handleProbeCommandChange(newIndex);
            },
        },
        PROBE_ROUTINE_SCROLL_LEFT: {
            title: 'Probe Routine Scroll Left',
            keys: '',
            cmd: 'PROBE_ROUTINE_SCROLL_LEFT',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                const { availableProbeCommands, selectedProbeCommand } = state;

                let newIndex = selectedProbeCommand - 1;
                if (newIndex < 0) {
                    newIndex = availableProbeCommands.length - 1;
                }
                actions.handleProbeCommandChange(newIndex);
            },
        },
        PROBE_DIAMETER_SCROLL_UP: {
            title: 'Probe Diameter Scroll Up',
            keys: '',
            cmd: 'PROBE_DIAMETER_SCROLL_UP',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                const { toolDiameter, availableTools, units } = state;
                const toolUnits =
                    units === METRIC_UNITS
                        ? 'metricDiameter'
                        : 'imperialDiameter';
                const currIndex = availableTools.findIndex(
                    (element) => element[toolUnits] === toolDiameter,
                );

                let newIndex = currIndex - 1;
                if (newIndex < 0) {
                    newIndex = availableTools.length - 1;
                }
                actions._setToolDiameter({
                    value: availableTools[newIndex][`${toolUnits}`],
                });
            },
        },
        PROBE_DIAMETER_SCROLL_DOWN: {
            title: 'Probe Diameter Scroll Down',
            keys: '',
            cmd: 'PROBE_DIAMETER_SCROLL_DOWN',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                const { toolDiameter, availableTools, units } = state;
                const toolUnits =
                    units === METRIC_UNITS
                        ? 'metricDiameter'
                        : 'imperialDiameter';
                const currIndex = availableTools.findIndex(
                    (element) => element[toolUnits] === toolDiameter,
                );

                let newIndex = currIndex + 1;
                if (newIndex >= availableTools.length) {
                    newIndex = 0;
                }
                actions._setToolDiameter({
                    value: availableTools[newIndex][`${toolUnits}`],
                });
            },
        },
    };

    const addShuttleControlEvents = () => {
        combokeys.reload();

        Object.keys(shuttleControlEvents).forEach((eventName) => {
            const callback = (shuttleControlEvents[eventName] as ShuttleEvent)
                .callback;
            combokeys.on(eventName, callback);
        });
    };

    const removeShuttleControlEvents = () => {
        Object.keys(shuttleControlEvents).forEach((eventName) => {
            const callback = (shuttleControlEvents[eventName] as ShuttleEvent)
                .callback;
            combokeys.removeListener(eventName, callback);
        });
    };

    useEffect(() => {
        addShuttleControlEvents();
        useKeybinding(shuttleControlEvents);
        gamepad.on('gamepad:button', (event: GamepadDetail) =>
            runAction({ event }),
        );

        return () => {
            removeShuttleControlEvents();
        };
    }, []);

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
                    <div className="flex w-full bg-white rounded-md border-solid border border-gray-300 p-[2px]">
                        {availableProbeCommands.map((command, index) => (
                            <Button
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
                            </Button>
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
                            className={cx(
                                'rounded-[0.2rem] border-solid border-2 p-2',
                                'w-full max-w-[125px] h-[max(30px,3vh)] self-start',
                                {
                                    'border-blue-400 bg-white [box-shadow:_1px_1px_3px_var(--tw-shadow-color)] shadow-gray-400':
                                        canClick,
                                    'border-gray-500 bg-gray-400': !canClick,
                                },
                            )}
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
