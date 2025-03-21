import { ReactNode, ComponentProps, forwardRef } from 'react';

import { cn } from 'app/lib/utils';
import { Input as ShadcnInput } from 'app/components/shadcn/Input';

type InputProps = ComponentProps<'input'> & {
    suffix?: ReactNode;
    label?: string | ReactNode;
    sizing?: 'sm' | 'md' | 'lg';
    wrapperClassName?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        { wrapperClassName, className, suffix, label, sizing = 'md', ...props },
        ref,
    ) => {
        const inputSize = {
            sm: 'h-8 text-sm px-2',
            md: 'h-10 text-md px-3',
            lg: 'h-12 text-lg px-4',
        }[sizing];

        return (
            <div className={cn('flex flex-col gap-2 w-full', wrapperClassName)}>
                {label && (
                    <label
                        className={cn('text-sm font-medium text-gray-700 mb-2')}
                    >
                        {label}
                    </label>
                )}
                <div className="relative flex items-center">
                    <ShadcnInput
                        className={cn(
                            'pr-10 dark:bg-dark dark:text-white dark:border-gray-500',
                            inputSize,
                            className,
                        )}
                        ref={ref}
                        {...props}
                    />
                    {suffix && (
                        <div className="absolute right-2 flex items-center pointer-events-none text-gray-500">
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
