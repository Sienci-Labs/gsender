import React from 'react';
import cx from 'classnames';
import { FaCheck, FaTimes } from 'react-icons/fa';

import { useTypedSelector } from 'app/hooks/useTypedSelector';

interface Props {
    label: string;
    on: boolean;
}

interface PinIndicatorProps {
    on?: boolean;
}

export function PinIndicator({ on = false }: PinIndicatorProps) {
    return (
        <div
            aria-label={on ? 'On' : 'Off'}
            title={on ? 'On' : 'Off'}
            className={cx('relative rounded-md py-1 px-2 w-3 h-3', {
                'bg-green-500': on,
                'bg-red-500': !on,
            })}
        >
            <span
                className="absolute inset-0 flex items-center justify-center text-white"
                aria-hidden="true"
            >
                {on ? (
                    <FaCheck className="w-2.5 h-2.5" />
                ) : (
                    <FaTimes className="w-2.5 h-2.5" />
                )}
            </span>
        </div>
    );
}

const PinRow: React.FC<Props> = ({ label, on = false }) => {
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );

    return (
        <div className="relative flex flex-row justify-between w-full items-center leading-7 border-b-gray-300 border-b-2 overflow-visible h-[3px] mt-3 mb-3">
            <div className="text-gray-500 bg-gray-50 pr-2 dark:text-white dark:bg-dark">
                {label}
            </div>
            <div className="bg-gray-50 pl-2 dark:text-white dark:bg-dark">
                {isConnected ? <PinIndicator on={on} /> : <span>{'-'}</span>}
            </div>
        </div>
    );
};

export default PinRow;
