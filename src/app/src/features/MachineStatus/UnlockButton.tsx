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

import React, { MouseEventHandler } from 'react';
import cx from 'classnames';

import { GRBL_ACTIVE_STATE_ALARM, GRBL_ACTIVE_STATE_HOLD } from '../../constants';
import { GRBL_ACTIVE_STATES_T } from 'definitions/general';
import { ALARM_CODE } from './definitions';

export interface UnlockProps {
    activeState: GRBL_ACTIVE_STATES_T,
    alarmCode: ALARM_CODE,
    onClick: MouseEventHandler<HTMLButtonElement>,
};

const UnlockButton: React.FC<UnlockProps> = ({ activeState, alarmCode, onClick }) => {
    const getButtonText = (): string => {
        if (activeState === GRBL_ACTIVE_STATE_HOLD) {
            return 'Cycle Start';
        } else if (alarmCode === 11) {
            return 'Click to Run Homing';
        }
        return 'Click to Unlock Machine';
    };
    
    return (
        <div className="flex items-center justify-center pointer-events-auto">
            <button
                type="button"
                className={cx(
                    "max-w-40 w-10/12 flex flex-row items-center justify-center p-4 rounded-[2rem] font-bold text-white border-solid border-[1px] opacity-90 hover:opacity-70",
                    {
                        "border-red-800 bg-red-600 grow [animation:grow_2s_infinite]": activeState === GRBL_ACTIVE_STATE_ALARM,
                        "border-yellow-800 bg-yellow-600": activeState !== GRBL_ACTIVE_STATE_ALARM,
                    }
                )}
                onClick={onClick}
            >
                <i
                    className={cx(
                        "text-5xl",
                        "fas",
                        activeState === GRBL_ACTIVE_STATE_ALARM && (alarmCode === 'Homing' || alarmCode === 11) ? 'fa-home' : 'fa-unlock'
                    )}
                    role="button"
                    tabIndex={-1}
                />
                {getButtonText()}
            </button>
        </div>
    );
};

export default UnlockButton;
