// https://ui.shadcn.com/docs/components/progress

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import cx from 'classnames';

interface Props {
    Bit?: string;
    className?: string;
    value: number;
    style?: React.CSSProperties;
}

const Progress = React.forwardRef<
    React.ElementRef<
        typeof ProgressPrimitive.Root & React.ForwardRefExoticComponent<Props>
    >,
    React.ComponentPropsWithoutRef<
        typeof ProgressPrimitive.Root & React.ForwardRefExoticComponent<Props>
    >
>(({ className, value, style, Bit, ...props }, ref) => (
    <div className="overflow-visible relative h-4 w-full rounded-full">
        <ProgressPrimitive.Root
            ref={ref}
            className={cx('relative h-4 w-full rounded-full', className)}
            {...props}
        >
            <div className="overflow-hidden h-full w-full">
                <ProgressPrimitive.Indicator
                    className="h-full w-full flex-1 transition-all bg-robin-500"
                    style={{
                        transform: `translateX(-${100 - (value || 0)}%)`,
                    }}
                />
            </div>
            {Bit && (
                <div
                    className="h-full w-full flex-1 transition-all absolute bottom-0"
                    style={{
                        transform: `translateX(-${100 - (value || 0)}%)`,
                    }}
                >
                    <img
                        src={Bit}
                        className="absolute bottom-0 right-[-5px] h-14"
                    />
                </div>
            )}
        </ProgressPrimitive.Root>
        {/* <div className="absolute bottom-0 left-0 transition-all flex-1 h-full w-full">
            <img
                src={Bit}
                style={{
                    transform: `translateX(-${100 - (value || 0)}%)`,
                }}
                className="h-14"
            />
        </div> */}
    </div>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
