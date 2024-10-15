import React from 'react';

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
}) => {
    return (
        <div className={cn('flex items-center', className)}>
            {label && <span className="mr-2">{label}</span>}
            <Toggle
                id={id}
                checked={checked}
                onChange={onChange}
                value={value}
                disabled={disabled}
                className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                    checked ? `bg-[${onColor}]` : 'bg-gray-200',
                    disabled && 'opacity-50 cursor-not-allowed',
                )}
            />
            {secondaryLabel && <span className="ml-2">{secondaryLabel}</span>}
        </div>
    );
};

export default Switch;
