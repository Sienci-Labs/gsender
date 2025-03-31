import React, { useRef } from 'react';
import { Axis } from 'app/features/DRO/utils/DRO.ts';

export interface WCSInputProps {
    value: string;
    disabled?: boolean;
    movementHandler?: (t: string | number, s: Axis) => void;
    axis: Axis;
}

export function WCSInput({
    value = '0.00',
    disabled = false,
    movementHandler,
    axis,
}: WCSInputProps) {
    const inputRef = useRef<HTMLInputElement>();

    const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const inputValue = Number(inputRef.current.value);

            if (Number.isNaN(inputValue)) {
                movementHandler(value, axis);
            }

            movementHandler(inputValue, axis);
            return;
        }
        if (e.key === 'Escape') {
            inputRef.current.blur();
        }
    };

    const onBlur = () => {
        inputRef.current.value = String(value);
    };

    return (
        <div
            key={`wcs-${axis}-${value}`}
            className="flex justify-center items-center"
        >
            <input
                type="number"
                defaultValue={value}
                disabled={disabled}
                ref={inputRef}
                onBlur={onBlur}
                onKeyDown={onKeyPress}
                className="text-xl font-bold flex items-center text-blue-500 font-mono w-[9ch] p-0 m-0 text-center border-none bg-gray-100 outline-none focus:bg-white dark:bg-dark "
            />
        </div>
    );
}
