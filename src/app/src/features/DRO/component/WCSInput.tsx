import { useRef } from 'react';

export interface WCSInputProps {
    value: number;
    disabled?: boolean;
    movementHandler?: (t: string | number) => void;
}

export function WCSInput({
    value,
    disabled = false,
    movementHandler,
}: WCSInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const onKeyPress = (e) => {
        if (e.key === 'Enter') {
            const inputValue = Number(e.target.value);
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

    return (
        <>
            <input
                type="number"
                defaultValue={value}
                value={value}
                disabled={disabled}
                ref={inputRef}
                onBlur={onBlur}
                onKeyDown={onKeyPress}
                className="text-xl flex items-center text-blue-500 font-bold font-mono w-[9ch] p-0 m-0 text-center border-none bg-gray-50"
            />
        </>
    );
}
