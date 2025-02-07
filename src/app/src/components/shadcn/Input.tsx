// https://ui.shadcn.com/docs/components/input

import * as React from 'react';

import cx from 'classnames';
import InputGroup from 'react-bootstrap/InputGroup';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    units?: string;
    label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, units, ...props }, ref) => {
        return (
            <div
                className={cx('grid gap-4', {
                    'grid-cols-[1fr_2fr] w-full': label != null,
                })}
            >
                {label && <div className="text-lg self-center">{label}</div>}
                <InputGroup className="flex flex-row flex-nowrap">
                    <input
                        type={type}
                        className={cx(
                            'flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                            className,
                        )}
                        ref={ref}
                        {...props}
                    />
                    {units && <InputGroup.Text>{units}</InputGroup.Text>}
                </InputGroup>
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input };
