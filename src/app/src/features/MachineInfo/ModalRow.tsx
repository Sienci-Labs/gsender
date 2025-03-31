import React from 'react';

import { useTypedSelector } from 'app/hooks/useTypedSelector';
interface Props {
    label: string;
    value: string;
}

const ModalRow: React.FC<Props> = ({ label, value }) => {
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );

    return (
        <div className="flex items-center justify-between w-full h-[3px] mt-3 mb-3 border-b-2 border-b-gray-300 dark:border-b-dark-lighter">
            <div className="bg-gray-50 pr-2 text-gray-500 dark:text-white dark:bg-dark">
                {label}
            </div>
            <div className="bg-gray-50 pl-2 text-right dark:text-white dark:bg-dark">
                {isConnected ? value : '-'}
            </div>
        </div>
    );
};

export default ModalRow;
