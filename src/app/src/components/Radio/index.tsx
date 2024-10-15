import React from 'react';
import { cn } from 'app/lib/utils';

type RadioButtonProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
};

type RadioGroupProps = {
    children: React.ReactNode;
    className?: string;
};

export function RadioButton({ label, className, ...props }: RadioButtonProps) {
    return (
        <label
            className={cn('inline-flex items-center cursor-pointer', className)}
        >
            <input
                type="radio"
                className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                {...props}
            />
            {label && <span className="ml-2 text-sm">{label}</span>}
        </label>
    );
}

export function RadioGroup({ children, className }: RadioGroupProps) {
    return <div className={cn('space-y-2', className)}>{children}</div>;
}
