import React from 'react';
import { ControlledInput } from 'app/components/ControlledInput';

export interface TextSettingInputProps {
    value?: string;
    index?: number;
    subIndex?: number;
    placeholder?: string;
    disabled?: boolean;
    onChange: (value: string) => void;
}

export function TextSettingInput({
    value = '',
    placeholder = '',
    disabled = false,
    onChange,
}: TextSettingInputProps) {
    return (
        <div className="ring-1 ring-gray-300 flex flex-row flex-1 rounded-md bg-white dark:bg-dark-secondary">
            <ControlledInput
                type="text"
                value={value ?? ''}
                placeholder={placeholder}
                disabled={disabled}
                immediateOnChange
                className="flex-1 p-2 focus:outline-none"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    onChange(e.target.value);
                }}
            />
        </div>
    );
}
