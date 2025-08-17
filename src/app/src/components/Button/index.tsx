import React, { JSX } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

import { Button as ShadcnButton } from 'app/components/shadcn/Button';

export const buttonStyle = tv({
    base: 'relative border rounded hover:opacity-90 shadow active:bg-opacity-70 active:shadow-[inset_7px_4px_6px_0px_rgba(59,_130,_246,_0.1)]',
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
        disabled: {
            true: 'bg-gray-300 border-gray-400 text-gray-500 hover:bg-gray-300 dark:bg-dark cursor-not-allowed',
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
        size?: 'mini' | 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'custom';
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
                    disabled,
                    active,
                    className,
                })}
                size={size}
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
            </ShadcnButton>
        );
    },
);

Button.displayName = 'Button';

export default Button;
