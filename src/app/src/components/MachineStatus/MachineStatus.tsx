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

import { connect } from 'react-redux';
import cx from 'classnames';
import get from 'lodash/get';
import controller from '../../lib/controller';
import AlarmDescriptionIcon from './AlarmDescriptionIcon';
import UnlockButton from './UnlockButton';
import { MachineStatusProps } from '../../definitions/interfaces/machine_status';
import { GRBL_ACTIVE_STATE_ALARM, GRBL_ACTIVE_STATE_HOME, GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_RUN } from '../../constants';

/**
 * Control Area component displaying machine status
 * @param {Object} state Default state given from parent component
 * @param {Object} actions Actions object given from parent component
 */
const MachineStatus: React.FC<MachineStatusProps> = ({ alarmCode, activeState, isConnected }) => {
    const unlock = (): void => {
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
            controller.command('homing');
            return;
        }
        controller.command('unlock');
    }

    /**
     * Function to output the machine state based on multiple conditions
     */
    const machineStateRender = (): React.ReactElement => {
        return (
            <div className="grid gap-y-3">
                {
                    isConnected && activeState ? (
                        <>
                            <div className={cx({
                                "bg-white text-black": activeState === GRBL_ACTIVE_STATE_IDLE || activeState === GRBL_ACTIVE_STATE_RUN,
                                "bg-blue-400 text-white": activeState === GRBL_ACTIVE_STATE_HOME,
                            })}>
                                {
                                    activeState === GRBL_ACTIVE_STATE_ALARM ? (
                                        <div>
                                            {activeState} ({alarmCode})<AlarmDescriptionIcon code={alarmCode} />
                                        </div>
                                    ) : (
                                        <div>{activeState}</div>
                                    )
                                }
                            </div>
                        </>
                    ) : <div className="bg-gray-400 text-white">Disconnected</div>
                }
                { activeState === GRBL_ACTIVE_STATE_ALARM && <UnlockButton onClick={unlock} alarmCode={alarmCode} activeState={activeState} /> }
            </div>
        )
    };

    return (
        <div className="grid grid-cols-[4fr_1fr_0]">
            <div />
            {machineStateRender()}
            <div />
        </div>
    );
}

export default connect((store) => {
    const $22 = get(store, 'controller.settings.settings.$22', '0');
    const alarmCode = get(store, 'controller.state.status.alarmCode');
    const activeState = get(store, 'controller.state.status.activeState');
    const isConnected = get(store, 'connection.isConnected');
    return {
        $22,
        alarmCode,
        activeState,
        isConnected
    };
})(MachineStatus);
