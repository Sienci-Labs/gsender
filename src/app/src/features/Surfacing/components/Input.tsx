import { forwardRef } from 'react';
import cx from 'classnames';

import { Input as ShadCNInput } from 'app/components/shadcn/Input';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, suffix, ...props }, ref) => {
        return (
            <div className="w-full flex gap-2 items-center">
                {label && (
                    <label className="block text-sm font-medium text-gray-900">
                        {label}
                    </label>
                )}
                <div className="flex gap-2 items-center justify-stretch w-full">
                    <ShadCNInput
                        ref={ref}
                        className={cx('w-full', className)}
                        {...props}
                    />
                    {suffix && (
                        <div className="flex items-center">{suffix}</div>
                    )}
                </div>
            </div>
        );
    },
);

Input.displayName = 'Input';

export default Input;
