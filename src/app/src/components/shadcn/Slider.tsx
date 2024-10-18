// https://ui.shadcn.com/docs/components/slider

'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import cx from 'classnames';

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, onValueChange, disabled, ...props }, ref) => (
    <SliderPrimitive.Root
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        className={cx(
            'relative flex w-full touch-none select-none items-center',
            className,
        )}
        {...props}
    >
        <SliderPrimitive.Track className="bg-gray-400 relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
            <SliderPrimitive.Range
                className={cx(' bg-blue-400 absolute h-full bg-primary', {
                    'bg-gray-500': disabled,
                })}
            />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
            className={cx(
                ' bg-white border-gray-500 block h-5 w-5 rounded-full border-2 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                {
                    'bg-gray-500': disabled,
                },
            )}
        />
    </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
