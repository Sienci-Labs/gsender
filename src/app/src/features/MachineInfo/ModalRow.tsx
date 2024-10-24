import React from 'react';
// import cx from 'classnames';

interface Props {
    label: string;
    value: string;
}

const ModalRow: React.FC<Props> = ({ label, value }) => {
    return (
        <div className="relative flex flex-row justify-between w-full items-center leading-7 border-b-gray-300 border-b-2 overflow-visible h-[3px] mt-3 mb-3">
            <div className="text-gray-500 bg-gray-50 pr-2">{label}</div>
            <div className="bg-gray-50 pl-2 min-w-12">
                <div className="flex float-left">{value}</div>
            </div>
        </div>
    );
};

export default ModalRow;
