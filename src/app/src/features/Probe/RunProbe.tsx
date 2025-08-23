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

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import { Button } from 'app/components/Button';
import cx from 'classnames';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { toast } from 'app/lib/toaster';

import ProbeCircuitStatus from './ProbeCircuitStatus';
import ProbeImage from './ProbeImage';
import CenterProbeSettings from './CenterProbeSettings';
import { Actions, State } from './definitions';
import { PROBING_CATEGORY } from 'app/constants';
import { TOUCHPLATE_TYPE_3D_TOUCH } from 'app/lib/constants';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';

interface RunProbeProps {
    state: State;
    actions: Actions;
}

const RunProbe = ({ actions, state }: RunProbeProps) => {
    const {
        connectionMade,
        connectionMadeRef,
        canClick,
        show,
        availableProbeCommands,
        selectedProbeCommand,
        touchplate,
        connectivityTest,
        centerProbeParams,
    } = state;
    const { probePinStatus } = useTypedSelector((state) => ({
        probePinStatus: state.controller.state.status?.pinState.P ?? false,
    }));

    useEffect(() => {
        if (!connectivityTest) {
            actions.setProbeConnectivity(true);
        } else if (probePinStatus) {
            actions.setProbeConnectivity(true);
        }
    }, [connectivityTest, probePinStatus, actions]);

    const [testInterval, setTestInterval] = useState<NodeJS.Timeout>(null);

    // useEffect(() => {
    //     useKeybinding(shuttleControlEvents);
    // }, []);

    const shuttleControlEvents = {
        START_PROBE: {
            title: 'Begin probing',
            keys: '',
            cmd: 'START_PROBE',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                if (!connectionMadeRef.current) {
                    return;
                }
                startProbe();
            },
        },
        CONFIRM_PROBE: {
            title: 'Confirm probe popup',
            keys: '',
            cmd: 'CONFIRM_PROBE',
            preventDefault: false,
            isActive: true,
            category: PROBING_CATEGORY,
            callback: () => {
                if (connectionMadeRef.current) {
                    return;
                }

                toast.info('Probe Confirmed Manually', {
                    position: 'bottom-right',
                });

                actions.setProbeConnectivity(true);
            },
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    const startProbe = (): void => {
        const probeCommands = actions.generateProbeCommands();
        // console.log(probeCommands);

        actions.runProbeCommands(probeCommands);
        toast.info('Initiated probing cycle', { position: 'bottom-right' });
        actions.onOpenChange(false);
    };

    useEffect(() => {
        return () => {
            testInterval && clearInterval(testInterval);
            setTestInterval(null);
        };
    }, []);

    const { touchplateType } = touchplate;
    //const probeCommands = actions.generateProbeCommands();
    //console.log(probeCommands.join('\n'));
    const probeCommand = availableProbeCommands[selectedProbeCommand];

    const probeActive = actions.returnProbeConnectivity();
    const is3DTouchCenter = touchplateType === TOUCHPLATE_TYPE_3D_TOUCH && probeCommand?.id === 'Center';

    return (
        <Dialog open={show} onOpenChange={actions.onOpenChange}>
            <DialogContent
                className={cx(
                    'flex flex-col justify-center items-center bg-gray-100 min-h-[450px] p-4',
                    is3DTouchCenter ? 'w-[800px]' : 'w-[650px]',
                    {
                        hidden: !show,
                    },
                )}
            >
                <DialogHeader className="text-robin-700 flex items-start justify-center">
                    <DialogTitle>{`Probe - ${probeCommand.id}`}</DialogTitle>
                </DialogHeader>
                {is3DTouchCenter ? (
                    <div className="grid grid-cols-[2fr_1fr] gap-4 w-[750px] min-h-[200px]">
                        <div className="flex flex-col space-y-4">
                            <div className="text-black leading-snug dark:text-white text-sm">
                                <p className="mb-2">
                                    Position the probe needle as close to the workpiece center as possible.
                                </p>
                                <p className="mb-2">
                                    Push the probe needle gently to test that it triggers properly (green light should activate).
                                </p>
                                <p className="mb-2">
                                    Configure probe parameters below.
                                </p>
                            </div>
                            <CenterProbeSettings
                                centerProbeParams={centerProbeParams}
                                onParamsChange={actions.updateCenterProbeParams}
                            />
                        </div>
                        <div className="flex flex-col justify-between items-center h-full">
                            <div className="flex flex-col items-center justify-center flex-1">
                                <ProbeImage
                                    probeCommand={probeCommand}
                                    touchplateType={touchplateType}
                                    centerProbeParams={centerProbeParams}
                                />
                                <ProbeCircuitStatus
                                    connected={canClick}
                                    probeActive={probeActive}
                                />
                            </div>
                            <Button
                                variant="primary"
                                disabled={!connectionMade}
                                onClick={startProbe}
                                className="mt-4"
                            >
                                {connectionMade
                                    ? 'Start Center Probe'
                                    : 'Waiting for probe circuit check...'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-[1.5fr_1fr] gap-2 w-[600px] min-h-[200px]">
                        <div className="flex flex-col justify-between pb-4">
                            <div className="text-black leading-snug dark:text-white">
                                {touchplateType === TOUCHPLATE_TYPE_3D_TOUCH ? (
                                    <>
                                        <p className="mb-3">
                                            Position the probe needle as shown in the image.
                                        </p>
                                        <p className="mb-3">
                                            Push the probe needle gently to test that it triggers properly (green light should activate).
                                        </p>
                                        <p className="mb-3">
                                            Ensure the probe is positioned correctly for the selected axis/axes.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="mb-3">
                                            1. Check the tool is positioned correctly
                                            (pictured).
                                        </p>
                                        <p className="mb-3">
                                            2. Lift your touch plate to the tool to check
                                            the circuit is good (indicated by a green
                                            light), then put it back where it was.{'\n'}
                                        </p>
                                        <p className="mb-3">
                                            3. In some cases, holding the touch plate still
                                            while probing will give a more consistent
                                            measurement.
                                        </p>
                                    </>
                                )}
                            </div>
                            <Button
                                variant="primary"
                                disabled={!connectionMade}
                                onClick={startProbe}
                            >
                                {connectionMade
                                    ? 'Start Probe'
                                    : 'Waiting for probe circuit check...'}
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
                )}
            </DialogContent>
        </Dialog>
    );
};

export default RunProbe;
