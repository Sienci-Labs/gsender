// https://ui.shadcn.com/docs/components/switch

'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import cx from 'classnames';

interface Props
    extends Omit<
        React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
        'onChange'
    > {
    position?: 'horizontal' | 'vertical';
    onChange: (checked: boolean, id: string) => void;
}

const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    Props
>(({ className, position = 'horizontal', onChange, id, ...props }, ref) => {
    const isVertical = position === 'vertical';
    return (
        <SwitchPrimitives.Root
            className={cx(
                'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-200 dark:data-[state=checked]:bg-blue-400 dark:data-[state=unchecked]:bg-dark dark:border-gray-500',
                className,
                isVertical ? 'flex-col h-11 w-6 ' : 'items-center h-6 w-11 ',
            )}
            {...props}
            ref={ref}
            id={id}
            onCheckedChange={(checked) => onChange(checked, id)}
        >
            <SwitchPrimitives.Thumb
                className={cx(
                    'pointer-events-none block h-5 w-5 rounded-full border data-[state=checked]:border-blue-500 data-[state=unchecked]:border-gray-300 bg-white dark:bg-gray-300 dark:data-[state=unchecked]:border-dark-lighter dark:data-[state=checked]:border-blue-400 shadow-lg ring-0 transition-transform ',
                    isVertical
                        ? 'data-[state=checked]:translate-y-[1px] data-[state=unchecked]:translate-y-[21px]'
                        : 'data-[state=checked]:translate-x-[21px] data-[state=unchecked]:translate-x-0',
                )}
            />
        </SwitchPrimitives.Root>
    );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
