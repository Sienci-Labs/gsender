import React, { useRef } from 'react';
import {Axis} from "app/features/DRO/utils/DRO.ts";

export interface WCSInputProps {
    value: number;
    disabled?: boolean;
    movementHandler?: (t: string | number, s: Axis) => void;
    axis: Axis
}

export function WCSInput({
    value = 0,
    disabled = false,
    movementHandler,
    axis
}: WCSInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const inputValue = Number(inputRef.current.value);
            console.log(inputValue);
            if (Number.isNaN(inputValue)) {
                movementHandler(value, axis);
            }

            movementHandler(value, axis);
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
        <>
            <input
                type="number"
                defaultValue={value}
                disabled={disabled}
                ref={inputRef}
                onBlur={onBlur}
                onKeyDown={onKeyPress}
                className="text-xl flex items-center text-blue-500 font-bold font-mono w-[9ch] p-0 m-0 text-center border-none bg-gray-100 outline-none focus:bg-white"
            />
        </>
    );
}
