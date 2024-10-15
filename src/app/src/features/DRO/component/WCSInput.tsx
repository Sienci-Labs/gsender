import React, { useRef } from 'react';

export interface WCSInputProps {
    value: number;
    disabled?: boolean;
    movementHandler?: (t: string | number) => void;
}

export function WCSInput({
    value = 0,
    disabled = false,
    movementHandler,
}: WCSInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const inputValue = Number(inputRef.current.value);
            if (Number.isNaN(inputValue)) {
                movementHandler(value);
            }

            movementHandler(inputValue);
            return;
        }
        if (e.key === 'Escape') {
            inputRef.current.blur();
        }
    };

    const onBlur = () => {
        inputRef.current.value = String(value);
    };
    const onChange = () => {};

    return (
        <>
            <input
                type="number"
                value={value}
                defaultValue={value}
                disabled={disabled}
                ref={inputRef}
                onBlur={onBlur}
                onKeyDown={onKeyPress}
                onChange={onChange}
                className="text-xl flex items-center text-blue-500 font-bold font-mono w-[9ch] p-0 m-0 text-center border-none bg-none outline-none bg-opacity-0"
            />
        </>
    );
}
