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

import { Button } from 'app/components/Button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import { PROBING_CATEGORY } from 'app/constants';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { i18n, translateKey, useAppTranslation } from 'app/i18n';
import { TOUCHPLATE_TYPE_3D } from 'app/lib/constants';
import { toast } from 'app/lib/toaster';
import useKeybinding from 'app/lib/useKeybinding';
import cx from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Actions,
    PROBE_DIRECTION_LABELS,
    PROBE_ROUTINE_LABELS,
    State,
} from './definitions';
import ProbeCircuitStatus from './ProbeCircuitStatus';
import ProbeImage from './ProbeImage';
import { shallowEqual } from 'react-redux';

interface RunProbeProps {
    state: State;
    actions: Actions;
}

const RunProbe = ({ actions, state }: RunProbeProps) => {
    const { t } = useAppTranslation();
    const actionsRef = useRef(actions);

    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    const {
        connectionMade,
        connectionMadeRef,
        canClick,
        show,
        availableProbeCommands,
        selectedProbeCommand,
        touchplate,
        connectivityTest,
        direction,
    } = state;
    const { probePinStatus } = useTypedSelector(
        (state) => ({
            probePinStatus: state.controller.state.status?.pinState.P ?? false,
        }),
        shallowEqual,
    );

    useEffect(() => {
        if (!connectivityTest) {
            actionsRef.current.setProbeConnectivity(true);
        } else if (probePinStatus) {
            actionsRef.current.setProbeConnectivity(true);
        }
    }, [connectivityTest, probePinStatus]);

    const [testInterval, setTestInterval] = useState<NodeJS.Timeout>(null);

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

                toast.info(i18n.t('notifications:probe.confirmedManually'), {
                    position: 'bottom-right',
                });

                actions.setProbeConnectivity(true);
            },
        },
    };

    useShuttleEvents(shuttleControlEvents);
    useEffect(() => {
        useKeybinding(shuttleControlEvents);
    }, []);

    const startProbe = useCallback((): void => {
        const probeCommands = actionsRef.current.generateProbeCommands();

        actionsRef.current.runProbeCommands(probeCommands);
        toast.info(i18n.t('notifications:probe.cycleStarted'), {
            position: 'bottom-right',
        });
        actionsRef.current.onOpenChange(false);
    }, []);

    useEffect(() => {
        return () => {
            testInterval && clearInterval(testInterval);
            setTestInterval(null);
        };
    }, []);

    const { touchplateType } = touchplate;
    //const probeCommands = actions.generateProbeCommands();
    //console.log(probeCommands.length);
    const probeCommand = availableProbeCommands[selectedProbeCommand];
    const directionLabel = PROBE_DIRECTION_LABELS[direction]
        ? translateKey(PROBE_DIRECTION_LABELS[direction])
        : t('probe:run.directions.unknown');
    const showDirectionWarning = direction !== 0;
    const is3DProbe = touchplateType === TOUCHPLATE_TYPE_3D;

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
                <DialogHeader className="text-robin-700 flex items-start justify-center">
                    <DialogTitle>
                        {t('probe:run.title', {
                            routine: translateKey(
                                PROBE_ROUTINE_LABELS[probeCommand.id] ??
                                    probeCommand.id,
                            ),
                        })}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-[1.5fr_1fr] gap-2 w-[600px] min-h-[200px]">
                    <div className="flex flex-col justify-between pb-4">
                        <div className="text-black leading-snug dark:text-white">
                            <div
                                className={cx(
                                    'flex items-center p-4 text-sm text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50 w-full mb-3',
                                    {
                                        invisible: !showDirectionWarning,
                                    },
                                )}
                                role={
                                    showDirectionWarning ? 'alert' : undefined
                                }
                                aria-hidden={!showDirectionWarning}
                            >
                                <svg
                                    className="flex-shrink-0 inline w-4 h-4 me-3"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                </svg>
                                <span className="sr-only">
                                    {t('probe:run.warning')}
                                </span>
                                <div>
                                    <span className="font-medium">
                                        {t('probe:run.directionWarning', {
                                            corner: directionLabel,
                                        })}
                                    </span>
                                    <div>{t('probe:run.verify')}</div>
                                </div>
                            </div>
                            <p className="mb-3">
                                {t('probe:run.checkPosition')}
                            </p>
                            <p className="mb-3">
                                {is3DProbe
                                    ? t('probe:run.checkCircuit3D')
                                    : t('probe:run.checkCircuitPlate')}
                            </p>
                            {!is3DProbe && (
                                <p className="mb-3">
                                    {t('probe:run.holdPlate')}
                                </p>
                            )}
                        </div>
                        <Button
                            variant="primary"
                            disabled={!connectionMade}
                            onClick={startProbe}
                        >
                            {connectionMade
                                ? t('probe:run.start')
                                : t('probe:run.waitingForCircuit')}
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
