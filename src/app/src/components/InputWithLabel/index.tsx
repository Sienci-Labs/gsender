import React from 'react';
import classNames from 'classnames';

import Tooltip from 'app/components/Tooltip';

interface InputProps {
    value: string | number;
    label?: string;
    units?: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    additionalProps?: React.InputHTMLAttributes<HTMLInputElement>;
    className?: string;
    style?: React.CSSProperties;
    tooltip?: {
        content: string;
        [key: string]: any;
    };
}

const Input = ({
    value,
    label,
    units,
    onChange,
    additionalProps = { type: 'text' },
    className,
    style,
    tooltip,
}: InputProps) => {
    const ShowTooltip = ({
        tooltip,
        children,
    }: {
        tooltip: InputProps['tooltip'];
        children: React.ReactNode;
    }) => {
        if (tooltip?.content) {
            return <Tooltip {...tooltip}>{children}</Tooltip>;
        }
        return <>{children}</>;
    };

    return (
        <ShowTooltip tooltip={tooltip}>
            <div className={classNames('grid gap-4', { 'grid-cols-3': label })}>
                {label && (
                    <label className="text-lg self-center">{label}</label>
                )}
                <div className="flex">
                    <input
                        {...additionalProps}
                        value={value}
                        onChange={onChange}
                        type="number"
                        className={classNames(
                            'form-control text-xl text-center text-blue-500 px-1 z-0',
                            className,
                        )}
                        style={style}
                    />
                    {units && (
                        <span className="input-group-addon">{units}</span>
                    )}
                </div>
            </div>
        </ShowTooltip>
    );
};

export default Input;
