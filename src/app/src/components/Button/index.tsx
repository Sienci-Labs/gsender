import React, { JSX } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { FaExclamation } from 'react-icons/fa';
import { cx } from 'class-variance-authority';

import { Button as ShadcnButton } from 'app/components/shadcn/Button';

export const buttonStyle = tv({
    base: 'relative border rounded hover:opacity-90 px-3 shadow active:bg-opacity-70 active:shadow-[inset_7px_4px_6px_0px_rgba(59,_130,_246,_0.1)]',
    variants: {
        variant: {
            primary: 'border-blue-500 text-white bg-blue-500',
            secondary:
                'border-robin-500 hover:bg-gray-200 text-gray-600 bg-white dark:bg-dark dark:text-gray-200',
            alt: 'bg-robin-500 text-white border-robin-500',
            outline:
                'border-robin-500 hover:bg-gray-200 text-gray-600 bg-white dark:bg-dark text-black dark:text-white',
            ghost: 'text-gray-600 dark:text-gray-300 border-none shadow-none',
            active: 'border-robin-500 hover:bg-gray-200 text-gray-600 bg-white dark:bg-dark dark:text-gray-200',
        },
        size: {
            sm: 'h-8 text-sm',
            md: 'h-10 text-base',
            lg: 'h-12 text-lg',
        },
        disabled: {
            true: 'bg-gray-300 border-gray-400 text-gray-500 hover:bg-gray-300 dark:bg-dark',
        },
        active: {
            true: 'bg-gray-200 shadow-[inset_7px_4px_6px_0px_rgba(59,_130,_246,_0.1)]',
        },
    },
    defaultVariants: {
        variant: 'secondary',
        size: 'md',
        active: false,
    },
});

export type ButtonVariants = VariantProps<typeof buttonStyle>;

export type ButtonProps = ButtonVariants &
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        children?: React.ReactNode;
        icon?: JSX.Element;
        disabled?: boolean;
        className?: string;
        text?: string;
        active?: boolean;
    };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (props, ref) => {
        const {
            variant,
            size,
            disabled,
            className,
            children,
            icon,
            text,
            active,
            ...rest
        } = props;

        return (
            <ShadcnButton
                className={buttonStyle({
                    variant,
                    size,
                    disabled,
                    active,
                    className,
                })}
                disabled={disabled}
                ref={ref}
                {...rest}
            >
                {children ? (
                    children
                ) : (
                    <span className="flex items-center gap-1">
                        {icon}
                        {text}
                    </span>
                )}

                {active && (
                    <div className="absolute -top-3 -right-2">
                        <div
                            className={cx(
                                'w-5 h-5 rounded-full border flex items-center justify-center bg-red-600 border-red-700 animate-pulse',
                            )}
                        >
                            <FaExclamation className="text-white animate-bounce w-2 h-2" />
                        </div>
                    </div>
                )}
            </ShadcnButton>
        );
    },
);

Button.displayName = 'Button';

export default Button;
