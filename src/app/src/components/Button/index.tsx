import React, { JSX } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

import { Button as ShadcnButton } from 'app/components/shadcn/Button';

export const buttonStyle = tv({
    base: 'border rounded hover:opacity-90 px-3 shadow',
    variants: {
        variant: {
            primary: 'border-blue-500 text-white bg-blue-500',
            secondary:
                'border-robin-500 hover:bg-gray-200 text-gray-600 bg-white dark:bg-dark dark:text-gray-200',
            alt: 'bg-robin-500 text-white border-robin-500',
            outline:
                'border-robin-500 hover:bg-gray-200 text-gray-600 bg-white dark:bg-dark text-black dark:text-white',
            ghost: 'text-gray-600 dark:text-gray-300 border-none shadow-none',
        },
        size: {
            sm: 'h-8 text-sm',
            md: 'h-10 text-base',
            lg: 'h-12 text-lg',
        },
        disabled: {
            true: 'bg-gray-300 border-gray-400 text-gray-500 hover:bg-gray-300 dark:bg-dark',
        },
    },
    defaultVariants: {
        variant: 'secondary',
        size: 'md',
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
            ...rest
        } = props;

        return (
            <ShadcnButton
                className={buttonStyle({ variant, size, disabled, className })}
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
