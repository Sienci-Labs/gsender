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
import { FaHome, FaUnlock } from 'react-icons/fa';

import { GRBL_ACTIVE_STATE_ALARM } from 'app/constants';
import { GRBL_ACTIVE_STATES_T } from 'app/definitions/general';
import { ALARM_CODE } from './definitions';

export interface UnlockProps {
    activeState: GRBL_ACTIVE_STATES_T;
    alarmCode: ALARM_CODE;
    onClick: MouseEventHandler<HTMLButtonElement>;
}

const UnlockButton: React.FC<UnlockProps> = ({
    activeState,
    alarmCode,
    onClick,
}) => {
    const getButtonText = (): string => {
        if (
            activeState === GRBL_ACTIVE_STATE_ALARM &&
            (alarmCode === 11 || alarmCode === 'Homing')
        ) {
            return 'Click to Run Homing';
        }
        return 'Click to Unlock Machine';
    };

    const SymbolComponent =
        activeState === GRBL_ACTIVE_STATE_ALARM &&
        (alarmCode === 'Homing' || alarmCode === 11) ? (
            <FaHome
                className="text-9xl h-16 mr-1"
                role="button"
                tabIndex={-1}
            />
        ) : (
            <FaUnlock
                className="text-9xl h-16 mr-1"
                role="button"
                tabIndex={-1}
            />
        );

    return (
        <div className="flex items-center justify-center pointer-events-auto z-50">
            <button
                type="button"
                className={cx(
                    'w-[8.5rem] z-50 flex flex-row items-center justify-between p-3 rounded-3xl leading-tight line-s text-white border-solid border opacity-90 hover:opacity-70',
                    {
                        'border-red-800 bg-red-600 grow [animation:grow_2s_infinite]':
                            activeState === GRBL_ACTIVE_STATE_ALARM,
                        'border-yellow-800 bg-yellow-600':
                            activeState !== GRBL_ACTIVE_STATE_ALARM,
                        // "pr-1": alarmCode !== 'Homing' && alarmCode !== 11 // this is for adjusting the position of the text
                    },
                )}
                onClick={onClick}
            >
                {SymbolComponent}
                {getButtonText()}
            </button>
        </div>
    );
};

export default UnlockButton;
