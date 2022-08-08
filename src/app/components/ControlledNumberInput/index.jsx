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

import React, { useState, useRef, useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';

const ControlledNumberInput = ({ className, value, type = 'decimal', externalOnChange = null, ...props }) => {
    const inputRef = useRef();
    const [originalValue, setOriginalValue] = useState(value);
    const [localValue, setLocalValue] = useState(value);

    /* If the value is changed up the tree, update both displayed and original value stored in component */
    useEffect(() => {
        setOriginalValue(value);
        setLocalValue(value);
    }, [value]);

    // Memoized debounced onChange to avoid creating a new function on each re-render
    const debouncedExternalOnChange = useMemo(() => debounce(externalOnChange, 500), []);

    const onFocus = () => {
        //inputRef.current.select();
    };

    const onBlur = (e) => {
        if (localValue && localValue !== originalValue) {
            setLocalValue(inputRef.current.value);
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
            onChange(e);
        }
    };

    const onChange = (e) => {
        setLocalValue(inputRef.current.value);
        if (externalOnChange) {
            debouncedExternalOnChange(e);
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
