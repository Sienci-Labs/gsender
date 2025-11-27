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

import { useState, useRef, useEffect } from 'react';

import { METRIC_UNITS } from 'app/constants';
import store from 'app/store';
import { round } from 'app/lib/rounding';

export interface ControlledNumberInputProps {
    className?: string;
    value: number | string;
    externalOnChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    max?: number;
    min?: number;
    hasRounding?: boolean;
    props?: object;
    type?: string;
}

// default max value is the highest number consisting only of 9s that is below the safe integer value
// it's more aesthetic than 9007199254740991 lol
export function ControlledNumberInput({
    className,
    value,
    type = 'decimal',
    externalOnChange = null,
    max = 999999999999999,
    min = -999999999999999,
    hasRounding = true,
    ...props
}: ControlledNumberInputProps) {
    const inputRef = useRef(null);
    const [originalValue, setOriginalValue] = useState(value);
    const [localValue, setLocalValue] = useState(value);
    const units = store.get('workspace.units', METRIC_UNITS);

    const updateLocalValue = (value: number | string) => {
        if (hasRounding) {
            setLocalValue(round(value, units));
        } else {
            setLocalValue(value);
        }
    };

    const updateOriginalValue = (value: number | string) => {
        if (hasRounding) {
            setOriginalValue(round(value, units));
        } else {
            setOriginalValue(value);
        }
    };

    /* If the value is changed up the tree, update both displayed and original value stored in component */
    useEffect(() => {
        updateOriginalValue(value);
        updateLocalValue(value);
    }, [value]);

    const onFocus = () => {
        //inputRef.current.select();
    };

    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const current = inputRef.current.value;
        if (localValue && localValue !== originalValue) {
            if (current < min) {
                inputRef.current.value = min;
                updateLocalValue(min);
            } else if (current > max) {
                inputRef.current.value = max;
                updateLocalValue(max);
            } else {
                updateLocalValue(current);
            }
            onChange(e);
        } else {
            updateLocalValue(originalValue);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            updateLocalValue(originalValue);
            inputRef.current.blur();
        } else if (e.key === 'Enter') {
            inputRef.current.blur();
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateLocalValue(inputRef.current.value);
        if (externalOnChange) {
            externalOnChange(e);
        }
    };

    const localChange = () => {
        setLocalValue(inputRef.current.value); // no rounding on change
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
}

export default ControlledNumberInput;
