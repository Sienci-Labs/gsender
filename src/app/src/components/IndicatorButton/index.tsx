import React from 'react';
import cn from 'classnames';

export interface IndicatorButtonProps {
    label: string;
    icon: React.ReactNode;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}

export function IndicatorButton({
    label,
    icon,
    active = false,
    disabled = false,
    onClick,
}: IndicatorButtonProps): JSX.Element {
    return (
        <button
            type="button"
            className={cn(
                'p-2 border border-blue-500 rounded-lg shadow-lg hover:bg-gray-50 min-w-20 min-h-20 flex flex-col gap-2 justify-around items-center shadow-blue-200 text-4xl dark:hover:bg-dark-lighter',
                {
                    'bg-blue-500 text-gray-500 hover:bg-blue-400 hover:text-gray-900':
                        active,
                },
            )}
            disabled={disabled}
            onClick={onClick}
        >
            <span
                className={cn('text-blue-300', {
                    'animate-pulse dark:text-white': active,
                })}
            >
                {icon}
            </span>
            <span
                className={cn('text-sm text-blue-500', {
                    'text-gray-200': active,
                })}
            >
                {label}
            </span>
        </button>
    );
}
