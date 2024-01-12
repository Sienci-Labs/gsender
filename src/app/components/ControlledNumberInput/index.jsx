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

import React, { useState, useRef, useEffect } from 'react';

// default max value is the highest number consisting only of 9s that is below the safe integer value
// it's more aesthetic than 9007199254740991 lol
const ControlledNumberInput = ({ className, value, type = 'decimal', externalOnChange = null, max = 999999999999999, min = -999999999999999, ...props }) => {
    const inputRef = useRef();
    const [originalValue, setOriginalValue] = useState(value);
    const [localValue, setLocalValue] = useState(value);

    /* If the value is changed up the tree, update both displayed and original value stored in component */
    useEffect(() => {
        setOriginalValue(value);
        setLocalValue(value);
    }, [value]);

    const onFocus = () => {
        //inputRef.current.select();
    };

    const onBlur = (e) => {
        const current = inputRef.current.value;
        if (localValue && localValue !== originalValue) {
            if (current < min) {
                inputRef.current.value = min;
                setLocalValue(min);
            } else if (current > max) {
                inputRef.current.value = max;
                setLocalValue(max);
            } else {
                setLocalValue(current);
            }
            onChange(e);
        } else {
            setLocalValue(originalValue);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            setLocalValue(originalValue);
            inputRef.current.blur();
        } else if (e.key === 'Enter') {
            inputRef.current.blur();
        }
    };

    const onChange = (e) => {
        setLocalValue(inputRef.current.value);
        if (externalOnChange) {
            externalOnChange(e);
        }
    };

    const localChange = (e) => {
        setLocalValue(inputRef.current.value);
    };

    return (
        <input
            type={type}
            className={className}
            ref={inputRef}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            onChange={localChange}
            value={localValue}
            {...props}
        />
    );
};

export default ControlledNumberInput;
