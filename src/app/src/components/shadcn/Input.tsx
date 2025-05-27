import * as React from 'react';
import { cn } from 'app/lib/utils';

type InputProps = React.ComponentProps<'input'> & {
    suffix?: React.ReactNode;
    label?: string | React.ReactNode;
    sizing?: 'xs' | 'sm' | 'md' | 'lg';
    wrapperClassName?: string;
    clearOnEnter?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        { wrapperClassName, className, suffix, label, sizing = 'md', ...props },
        ref,
    ) => {
        const inputSize = {
            xs: 'h-6 text-sm px-2',
            sm: 'h-8 text-sm px-2',
            md: 'h-10 text-md px-3',
            lg: 'h-12 text-lg px-4',
        }[sizing];

        return (
            <div className={cn('flex flex-col gap-2 w-full', wrapperClassName)}>
                {label && (
                    <label
                        className={cn(
                            'text-sm font-medium text-gray-700 dark:text-white mb-2',
                        )}
                    >
                        {label}
                    </label>
                )}
                <div className="relative flex items-center">
                    <input
                        className={cn(
                            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                            'text-blue-500 pr-10 dark:bg-dark dark:text-white dark:border-gray-500',
                            inputSize,
                            className,
                        )}
                        ref={ref}
                        {...props}
                    />
                    {suffix && (
                        <div className="absolute right-2 text-xs flex items-center pointer-events-none text-gray-500 dark:text-white">
                            {suffix}
                        </div>
                    )}
                </div>
            </div>
        );
    },
);

Input.displayName = 'Input';

export { Input };
