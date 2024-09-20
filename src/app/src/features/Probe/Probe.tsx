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
import { ShuttleControlEvents, ShuttleEvent } from 'app/lib/definitions/shortcuts';
import { Actions, State } from './definitions';
import { GamepadDetail } from 'app/lib/gamepad/definitions';
import { Button } from 'app/components/shadcn/Button';

interface Props {
    state: State,
    actions: Actions,
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
                const toolUnits = units === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter';
                const currIndex = availableTools.findIndex(element => element[toolUnits] === toolDiameter);

                let newIndex = currIndex - 1;
                if (newIndex < 0) {
                    newIndex = availableTools.length - 1;
                }
                actions._setToolDiameter({ value: availableTools[newIndex][`${toolUnits}`] });
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
                const toolUnits = units === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter';
                const currIndex = availableTools.findIndex(element => element[toolUnits] === toolDiameter);

                let newIndex = currIndex + 1;
                if (newIndex >= availableTools.length) {
                    newIndex = 0;
                }
                actions._setToolDiameter({ value: availableTools[newIndex][`${toolUnits}`] });
            },
        }
    }

    const addShuttleControlEvents = () => {
        combokeys.reload();

        Object.keys(shuttleControlEvents).forEach(eventName => {
            const callback = (shuttleControlEvents[eventName] as ShuttleEvent).callback;
            combokeys.on(eventName, callback);
        });
    }

    const removeShuttleControlEvents = () => {
        Object.keys(shuttleControlEvents).forEach(eventName => {
            const callback = (shuttleControlEvents[eventName] as ShuttleEvent).callback;
            combokeys.removeListener(eventName, callback);
        });
    }

    useEffect(() => {
        addShuttleControlEvents();
        useKeybinding(shuttleControlEvents);
        gamepad.on('gamepad:button', (event: GamepadDetail) => runAction({ event }));

        return () => {
            removeShuttleControlEvents();
        }
    }, [])


    const {
        canClick,
        availableProbeCommands,
        selectedProbeCommand,
        touchplate,
        direction
    } = state;

    const { touchplateType } = touchplate;
    const probeCommand = availableProbeCommands[selectedProbeCommand];

    return (
        <div className="grid grid-cols-[5fr_3fr] w-[95%] absolute gap-4">
            <div className="w-full h-full m-auto grid gap-4">
                <div className="h-full grid grid-rows[4fr_2fr] self-center gap-2">
                    <ProbeDirectionSelection direction={direction} onClick={actions.nextProbeDirection} />
                    <div className="flex flex-col gap-4 self-end">
                        <div className="grid grid-cols-[1fr_5fr] gap-4 items-center">
                            <label style={{ margin: 0 }}>Axis</label>

                            <div className="flex w-full">
                                {
                                    availableProbeCommands.map((command, index) => (
                                        <Button
                                            key={command.id}
                                            onClick={() => actions.handleProbeCommandChange(index)}
                                            className={cx(
                                                "m-0 rounded-none relative transition-[250ms_ease-in-out] h-[calc(4vh+3px)] border-solid border-t-robin-400 border-r-0 last:border-r-[1px] last:border-solid last:border-robin-400",
                                                {
                                                    "bg-robin-600 opacity-30": index === selectedProbeCommand
                                                }
                                            )}
                                        >
                                            { index === selectedProbeCommand && (<div className="m-0 rounded-none transition-[250ms_ease-in-out] border-solid border-t-robin-400 border-r-0 last:border-r-[1px] last:border-solid last:border-robin-400 w-full h-1 bg-robin-700 absolute bottom-0" />) }
                                            {command.id.split(' ')[0]}
                                        </Button>
                                    ))
                                }
                            </div>
                        </div>
                        <div className={cx("grid grid-cols-[1fr_5fr] gap-4 items-center", { "hidden": !probeCommand?.tool })}>
                            <label>Tool</label>
                            <div className="flex flex-col gap-2 w-full">
                                <ProbeDiameter actions={actions} state={state} probeCommand={probeCommand} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-[1fr_5fr] gap-4 items-center">
                        <div />
                        <Button
                            onClick={() => actions.onOpenChange(true)}
                            disabled={!canClick}
                            className="m-auto w-full max-w-[125px] h-[max(25px,3vh)] self-start"
                        >
                            Probe
                        </Button>
                    </div>
                </div>
            </div>
            <ProbeImage touchplateType={touchplateType} probeCommand={probeCommand} />
        </div>
    );
}

export default Probe;
