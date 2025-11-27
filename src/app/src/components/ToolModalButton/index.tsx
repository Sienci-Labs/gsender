import React from 'react';
import cx from 'classnames';

type ToolModalButtonProps = {
    className?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ToolModalButton({
    className = '',
    icon,
    children,
    ...props
}: ToolModalButtonProps) {
    return (
        <button
            type="button"
            className={cx(
                'w-full bg-white border border-[#3e85c7] shadow rounded text-[#3e85c7] flex flex-row p-0 items-stretch text-base mb-4 transition-colors duration-150 ' +
                    'hover:bg-gray-100 disabled:bg-black/15 disabled:text-black/30 disabled:border-black/15 disabled:cursor-not-allowed',
                className,
            )}
            {...props}
        >
            <div
                className={cx(
                    'w-12 bg-[#3e85c7] flex items-center justify-center mr-2 flex-col',
                    'text-white text-[1.6rem]',
                )}
            >
                {icon}
            </div>
            <div className="py-4 flex flex-grow justify-center">{children}</div>
        </button>
    );
}

export default ToolModalButton;
