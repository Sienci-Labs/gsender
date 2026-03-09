import React, { useId } from 'react';

import Toggle from './Toggle';
import { cn } from 'app/lib/utils';

interface SwitchProps {
    label?: string;
    checked?: boolean;
    onChange: (
        checked: boolean,
        e: React.ChangeEvent<HTMLInputElement>,
    ) => void;
    className?: string;
    disabled?: boolean;
    onColor?: string;
    secondaryLabel?: string;
    value?: number;
    id?: string;
    position?: 'horizontal' | 'vertical';
}

const Switch: React.FC<SwitchProps> = ({
    label,
    checked = false,
    onChange,
    className,
    disabled = false,
    onColor = '#295d8d',
    secondaryLabel,
    value,
    id,
    position = 'horizontal',
}) => {
    const generatedId = useId();
    const switchId = id || generatedId;

    return (
        <div className={cn('flex items-center', className)}>
            {label && (
                <label
                    htmlFor={switchId}
                    className="mr-2 cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                    {label}
                </label>
            )}
            <Toggle
                id={switchId}
                checked={checked}
                onChange={onChange}
                value={value}
                disabled={disabled}
                className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                    checked ? `bg-[${onColor}]` : 'bg-gray-200',
                    disabled && 'opacity-50 cursor-not-allowed',
                )}
                position={position}
            />
            {secondaryLabel && (
                <label
                    htmlFor={switchId}
                    className="ml-2 cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                    {secondaryLabel}
                </label>
            )}
        </div>
    );
};

export default Switch;
