// https://ui.shadcn.com/docs/components/radio-group

'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
// import { Circle } from 'lucide-react';

import cx from 'classnames';

interface RadioGroupProps
    extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
    size: string;
}

const RadioGroup = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
    return (
        <RadioGroupPrimitive.Root
            className={cx('grid gap-2', className)}
            {...props}
            ref={ref}
        />
    );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Item>,
    // React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
    RadioGroupProps
>(({ className, size, ...props }, ref) => {
    return (
        <RadioGroupPrimitive.Item
            ref={ref}
            className={cx(
                'aspect-square h-4 w-4 rounded-full border border-gray-500 bg-white border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className,
                size,
            )}
            {...props}
        >
            <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                {/* <Circle className="h-4 w-4 border-blue-500 border-4 rounded-full" /> */}
                <div
                    className={cx(
                        'absolute h-4 w-4 border-blue-500 border-8 rounded-full',
                        size,
                    )}
                ></div>
            </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
    );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
