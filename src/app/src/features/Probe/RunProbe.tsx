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

import { useEffect, useState } from 'react';
// import Modal from '@trendmicro/react-modal';
import combokeys from 'app/lib/combokeys';
import gamepad, { runAction } from 'app/lib/gamepad';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';
// import FunctionButton from 'app/components/FunctionButton/FunctionButton';

import ProbeCircuitStatus from './ProbeCircuitStatus';
import ProbeImage from './ProbeImage';
import { PROBING_CATEGORY } from '../../constants';
import useKeybinding from '../../lib/useKeybinding';
import { Actions, State } from './definitions';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import { Button } from 'app/components/shadcn/Button';
import cx from 'classnames';
import { GamepadDetail } from 'app/lib/gamepad/definitions';
import {
    ShuttleControlEvents,
    ShuttleEvent,
} from 'app/lib/definitions/shortcuts';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

interface Props {
    state: State;
    actions: Actions;
}

const RunProbe = ({ actions, state }: Props) => {
    const {
        connectionMade,
        canClick,
        show,
        availableProbeCommands,
        selectedProbeCommand,
        touchplate,
        connectivityTest,
    } = state;
    const { probePinStatus } = useTypedSelector((state) => ({
        probePinStatus: state.controller.state.status?.pinState.P ?? false,
    }));

    if (!connectivityTest) {
        actions.setProbeConnectivity(true);
    } else if (probePinStatus) {
        actions.setProbeConnectivity(true);
    }

    const [testInterval, setTestInterval] = useState<NodeJS.Timeout>(null);

    const shuttleControlEvents: ShuttleControlEvents = {
        START_PROBE: {
            title: 'Start Probing',
            keys: '',
            cmd: 'START_PROBE',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                startProbe();
            },
        },
        CONFIRM_PROBE: {
            title: 'Confirm Probe',
            keys: '',
            cmd: 'CONFIRM_PROBE',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                if (connectionMade) {
                    return;
                }

                Toaster.pop({
                    msg: 'Probe Confirmed Manually',
                    type: TOASTER_INFO,
                    duration: 5000,
                    icon: 'fa-satellite-dish',
                });

                actions.setProbeConnectivity(true);
            },
        },
    };

    const startProbe = (): void => {
        const probeCommands = actions.generateProbeCommands();
        // console.log(probeCommands);

        actions.runProbeCommands(probeCommands);
        Toaster.pop({
            msg: 'Initiated probing cycle',
            type: TOASTER_INFO,
            duration: 5000,
            icon: 'fa-satellite-dish',
        });
        actions.onOpenChange(false);
    };

    useEffect(() => {
        addShuttleControlEvents();
        useKeybinding(shuttleControlEvents);

        gamepad.on('gamepad:button', (event: GamepadDetail) =>
            runAction({ event }),
        );

        return () => {
            testInterval && clearInterval(testInterval);
            setTestInterval(null);
            removeShuttleControlEvents();
        };
    }, []);

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

    const { touchplateType } = touchplate;
    // const probeCommands = actions.generateProbeCommands();
    // console.log(probeCommands.join('\n'));
    const probeCommand = availableProbeCommands[selectedProbeCommand];

    const probeActive = actions.returnProbeConnectivity();

    return (
        <Dialog open={show} onOpenChange={actions.onOpenChange}>
            <DialogContent
                className={cx(
                    'flex flex-col justify-center items-center bg-gray-100 w-[650px] min-h-[450px] p-4',
                    {
                        hidden: !show,
                    },
                )}
            >
                <DialogHeader className="text-robin-700 flex items-start justify-center h-10 border-b-[1px] border-gray-400 mb-1">
                    <DialogTitle>{`Probe - ${probeCommand.id}`}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-[1.5fr_1fr] gap-3 w-[600px] min-h-[200px]">
                    <div className="flex flex-col justify-between pb-4">
                        <div className="text-black leading-snug">
                            <p className="mb-3">
                                Ensure tool is positioned as shown.
                            </p>
                            <p className="mb-3">
                                To confirm a reliable circuit, touch your plate
                                to the tool and look for the signal to be
                                robustly detected (indicated by a green light)
                                before returning the probe to the probing
                                position.{'\n'}
                            </p>
                            <p className="mb-3">
                                Probing cannot be run without confirming the
                                circuit.
                            </p>
                            <p className="mb-3">
                                Consider holding your touch plate in place
                                during probing to get a more consistent
                                measurement.
                            </p>
                        </div>
                        <Button
                            disabled={!connectionMade}
                            onClick={startProbe}
                            className={cx(
                                'rounded-[0.2rem] border-solid border-2 p-2',
                                {
                                    'border-blue-400 bg-white [box-shadow:_2px_2px_1px_var(--tw-shadow-color)] shadow-gray-400':
                                        connectionMade,
                                    'border-gray-500 bg-gray-400':
                                        !connectionMade,
                                },
                            )}
                        >
                            {connectionMade
                                ? 'Start Probe'
                                : 'Waiting on probe circuit confirmation...'}
                        </Button>
                    </div>
                    <div className="flex flex-col sm:m-auto sm:mb-4">
                        <ProbeImage
                            probeCommand={probeCommand}
                            touchplateType={touchplateType}
                        />
                        <ProbeCircuitStatus
                            connected={canClick}
                            probeActive={probeActive}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RunProbe;
