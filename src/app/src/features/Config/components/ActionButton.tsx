import React, { type JSX } from 'react';

export interface ActionButtonProps {
    onClick?: () => void;
    icon: JSX.Element;
    label: string;
    disabled?: boolean;
    testId?: string;
}

export const ActionButton = React.forwardRef(function ActionButton(
    {
        icon,
        onClick,
        label,
        disabled = false,
        testId = undefined,
    }: ActionButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>,
): JSX.Element {
    return (
        <button
            ref={ref}
            onClick={onClick}
            disabled={disabled}
            className="rounded-r-lg inline-flex h-full flex-col disabled:bg-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed items-center justify-center px-5 group group-hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 dark:disabled:bg-surface-elevated dark:disabled:text-content-secondary"
            data-testid={testId}
        >
            <span className="enabled:group-hover:text-blue-500 text-gray-600 dark:text-content-primary">
                {icon}
            </span>
            <span className="text-sm text-gray-600 enabled:group-hover:text-blue-500 dark:text-content-primary">
                {label}
            </span>
        </button>
    );
});
