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

import React, { useRef } from 'react';
import style from './MachinePositionInput.styl';

const MachinePositionInput = ({ value, handleManualMovement, disabled = false }) => {
    const inputRef = useRef();

    const onKeyPress = (e) => {
        if (e.key === 'Enter') {
            const inputValue = Number(e.target.value);
            if (Number.isNaN(inputValue)) {
                handleManualMovement(value);
            }

            handleManualMovement(inputValue);
            return;
        }
        if (e.key === 'Escape') {
            inputRef.current.blur();
        }
    };

    const onBlur = (e) => {
        inputRef.current.value = value;
    };
    return (
        <div key={value}>
            <input
                className={style.positionInput}
                type="number"
                defaultValue={value}
                onKeyDown={onKeyPress}
                onBlur={onBlur}
                ref={inputRef}
                disabled={disabled ? 'disabled' : ''}
            />
        </div>
    );
};

export default MachinePositionInput;
