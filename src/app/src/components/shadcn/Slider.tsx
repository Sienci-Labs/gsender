// https://ui.shadcn.com/docs/components/slider

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import cx from 'classnames';

interface Props
    extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
    trackClassName?: string;
    rangeClassName?: string;
    thumbClassName?: string;
}

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    Props
>(
    (
        {
            className,
            value,
            onValueChange,
            disabled,
            trackClassName,
            rangeClassName,
            thumbClassName,
            ...props
        },
        ref,
    ) => (
        <SliderPrimitive.Root
            ref={ref}
            value={value}
            onValueChange={onValueChange}
            className={cx(
                'relative flex w-full touch-none select-none items-center',
                className,
            )}
            disabled={disabled}
            {...props}
        >
            <SliderPrimitive.Track
                className={cx(trackClassName, {
                    'bg-gray-400 relative h-2 w-full grow overflow-hidden rounded-full bg-secondary':
                        !trackClassName,
                })}
            >
                <SliderPrimitive.Range
                    className={cx(rangeClassName, {
                        ' bg-robin-400 absolute h-full bg-primary':
                            !rangeClassName,
                        'bg-gray-500': disabled,
                    })}
                />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
                className={cx(thumbClassName, {
                    'border-gray-500 block h-5 w-5 rounded-full border-2 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2':
                        !thumbClassName,
                    'bg-white cursor-pointer': !disabled,
                    'bg-gray-300 cursor-not-allowed': disabled,
                })}
            />
        </SliderPrimitive.Root>
    ),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
