// https://ui.shadcn.com/docs/components/button

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, VariantProps } from 'class-variance-authority';

import cx from 'classnames';

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:bg-opacity-70 active:shadow-[inset_7px_4px_6px_0px_rgba(59,_130,_246,_0.1)]',
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                alt: 'bg-robin-500 text-white border-robin-500',
                destructive:
                    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline:
                    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                confirm:
                    'bg-blue-500 bg-opacity-20 border border-blue-500 text-blue-500 dark:text-white active:bg-opacity-10',
                cancel: 'bg-none border border-blue-500 text-gray-800 dark:text-blue-500',
            },
            disabled: {
                true: 'bg-gray-300 border-gray-400 text-gray-500 dark:bg-dark',
            },
            size: {
                mini: 'h-6 rounded-md px-[5px] w-full text-xs',
                xs: 'h-6 rounded-md px-4 max-xl:px-3 py-2 max-xl:py-1  w-full text-sm',
                sm: 'h-8 rounded-md px-4 max-xl:px-3 py-2 max-xl:py-1 w-full text-sm',
                md: 'h-10 rounded-md px-4 max-xl:px-3 py-2 max-xl:py-1 w-full text-base',
                lg: 'h-11 rounded-md px-8 max-xl:px-6 py-4 max-xl:py-2 w-full text-lg',
                icon: 'h-10 w-10',
                custom: '',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        { className, variant, size, disabled, asChild = false, ...props },
        ref,
    ) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <div className={cx({ 'cursor-not-allowed': disabled })}>
                <Comp
                    className={cx(
                        !disabled && buttonVariants({ variant, size }),
                        disabled && buttonVariants({ disabled, size }),
                        className,
                    )}
                    ref={ref}
                    disabled={disabled}
                    {...props}
                />
            </div>
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
