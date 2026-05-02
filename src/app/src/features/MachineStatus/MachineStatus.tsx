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
import { connect } from 'react-redux';
import cx from 'classnames';
import get from 'lodash/get';
import controller from '../../lib/controller';
import AlarmDescriptionIcon from './AlarmDescriptionIcon';
import UnlockButton from './UnlockButton';
import { UnlockButton as SmallUnlockButton } from 'app/features/UnlockButton';
import {
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_CHECK,
    GRBL_ACTIVE_STATE_DOOR,
    GRBL_ACTIVE_STATE_HOLD,
    GRBL_ACTIVE_STATE_HOME,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    GRBL_ACTIVE_STATE_RUN,
    GRBL_ACTIVE_STATE_TOOL,
} from '../../constants';
import { GRBL_ACTIVE_STATES_T } from 'app/definitions/general';
import { ALARM_CODE } from './definitions';
import {
    isATCAvailable,
    sendATCHomingDialog,
} from 'app/features/ATC/utils/ATCFunctions.ts';

interface MachineStatusProps {
    alarmCode: ALARM_CODE;
    activeState: GRBL_ACTIVE_STATES_T | null;
    isConnected: boolean;
    port: string | null;
}

interface Message {
    [key: GRBL_ACTIVE_STATES_T]: string;
}

/**
 * Control Area component displaying machine status
 * @param {Object} state Default state given from parent component
 * @param {Object} actions Actions object given from parent component
 */
const MachineStatus: React.FC<MachineStatusProps> = ({
    activeState,
    alarmCode,
    isConnected,
    port,
}) => {
    const isPortOpen = isConnected || !!port;
    const [hasFreshControllerState, setHasFreshControllerState] = useState(
        isPortOpen && !!activeState,
    );
    const displayActiveState =
        isPortOpen && hasFreshControllerState ? activeState : null;

    useEffect(() => {
        if (!isPortOpen) {
            setHasFreshControllerState(false);
        }
    }, [isPortOpen]);

    useEffect(() => {
        const handlePortOpen = () => {
            setHasFreshControllerState(false);
        };
        const handlePortClose = () => {
            setHasFreshControllerState(false);
        };
        const handleControllerState = () => {
            setHasFreshControllerState(true);
        };

        controller.addListener('serialport:open', handlePortOpen);
        controller.addListener('serialport:close', handlePortClose);
        controller.addListener('controller:state', handleControllerState);

        return () => {
            controller.removeListener('serialport:open', handlePortOpen);
            controller.removeListener('serialport:close', handlePortClose);
            controller.removeListener('controller:state', handleControllerState);
        };
    }, []);

    const unlock = (): void => {
        if (displayActiveState === GRBL_ACTIVE_STATE_ALARM) {
            if (
                alarmCode === 1 ||
                alarmCode === 2 ||
                alarmCode === 10 ||
                alarmCode === 14 ||
                alarmCode === 17
            ) {
                controller.command('reset:limit');
                return;
            } else if (alarmCode === 'Homing' || alarmCode === 11) {
                if (isATCAvailable()) {
                    sendATCHomingDialog();
                } else {
                    controller.command('homing');
                }
                return;
            }
        } else if (displayActiveState === GRBL_ACTIVE_STATE_HOLD) {
            return controller.command('cyclestart');
        }
        controller.command('unlock');
    };

    /**
     * Function to output the machine state based on multiple conditions
     */
    const machineStateRender = (): React.ReactElement => {
        const message: Message = {
            Idle: 'Idle',
            Run: 'Running',
            Hold: 'Hold',
            Jog: 'Jogging',
            Check: 'Check',
            Home: 'Homing',
            Sleep: 'Sleep',
            Alarm: 'Alarm',
            Disconnected: 'Disconnected',
            Tool: 'Tool Change',
            Door: 'Door',
        };

        return (
            <div
                className="flex relative flex-col items-center"
                aria-live="polite"
                role="status"
            >
                <SmallUnlockButton />
                <div
                    className={cx(
                        'transition-colors duration-100 ease-in-out flex max-sm:w-40 max-sm:text-normal w-72 h-[60px] justify-between items-center [clip-path:_polygon(0%_0%,_100%_0%,_85%_100%,_15%_100%)]',
                        {
                            'text-white bg-gray-800':
                                !displayActiveState,
                            'bg-gray-500 text-white':
                                displayActiveState === GRBL_ACTIVE_STATE_IDLE,
                            'bg-green-600 text-white':
                                displayActiveState === GRBL_ACTIVE_STATE_RUN ||
                                displayActiveState === GRBL_ACTIVE_STATE_JOG ||
                                displayActiveState === GRBL_ACTIVE_STATE_CHECK,
                            'bg-blue-500 text-white':
                                displayActiveState === GRBL_ACTIVE_STATE_HOME,
                            'bg-yellow-600 text-white':
                                displayActiveState === GRBL_ACTIVE_STATE_HOLD ||
                                displayActiveState === GRBL_ACTIVE_STATE_DOOR,
                            'bg-red-500 text-white':
                                displayActiveState === GRBL_ACTIVE_STATE_ALARM,
                            'bg-purple-600 text-white':
                                displayActiveState === GRBL_ACTIVE_STATE_TOOL,
                        },
                    )}
                >
                    {displayActiveState ? (
                        <>
                            {displayActiveState === GRBL_ACTIVE_STATE_ALARM ? (
                                <div className="flex w-full flex-row justify-center align-middle items-center font-light sm:text-base text-3xl mb-1">
                                    <div className="flex justify-center">
                                        {displayActiveState}
                                        {displayActiveState ===
                                            GRBL_ACTIVE_STATE_ALARM && (
                                            <span>({alarmCode})</span>
                                        )}
                                    </div>
                                    <div className="absolute right-3 flex float-right">
                                        <AlarmDescriptionIcon
                                            code={alarmCode}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <span className="flex w-full font-light text-3xl max-sm:text-base sm:text-normal mb-1 justify-center">
                                    {message[displayActiveState]}
                                </span>
                            )}
                        </>
                    ) : (
                        <h1 className="flex w-full font-light text-3xl max-sm:text-base mb-1 justify-center">
                            Disconnected
                        </h1>
                    )}
                </div>
                <div className="mt-4 z-50">
                    {displayActiveState === GRBL_ACTIVE_STATE_ALARM && (
                        <UnlockButton
                            onClick={unlock}
                            alarmCode={alarmCode}
                            activeState={displayActiveState}
                        />
                    )}
                </div>
            </div>
        );
    };

    return (
        // calc = half of width + sidebar width
        <div className="absolute top-0 left-1/2 right-1/2 -translate-x-1/2 max-sm:ml-0 max-sm:-translate-x-1/2 w-64 z-50 overflow-visible">
            {machineStateRender()}
        </div>
    );
};

export default connect((store) => {
    const $22 = get(store, 'controller.settings.settings.$22', '0');
    const alarmCode = get(store, 'controller.state.status.alarmCode', 0);

    const activeState = get(
        store,
        'controller.state.status.activeState',
        null,
    );
    const isConnected = get(store, 'connection.isConnected', false);
    const port = get(store, 'connection.port', null);
    return {
        $22,
        alarmCode,
        activeState,
        isConnected,
        port,
    };
})(MachineStatus);
