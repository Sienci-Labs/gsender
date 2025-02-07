/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import React from 'react';
import cx from 'classnames';
import { FaInfoCircle } from 'react-icons/fa';
import { IconType } from 'react-icons';

interface Props {
    className: string;
    Icon: IconType;
    children: React.ReactElement | string;
    disabled: boolean;
    onClick: () => void;
}

const ToolModalButton: React.FC<Props> = ({
    className,
    Icon = FaInfoCircle,
    children,
    disabled,
    onClick,
    ...props
}) => {
    return (
        <button
            type="button"
            className={cx(
                'w-full bg-white border-blue-500 border-1',
                '[--tw-shadow:0_4px_6px_-1px_rgba(0,0,0,0.1),_0_2px_4px_-1px_rgba(0,0,0,0.06)]',
                'shadow rounded text-blue-500 flex flex-row p-0 items-stretch text-base mb-4',
                'hover:bg-gray-300 disabled:bg-black disabled:bg-opacity-15 disabled:text-black',
                'disabled:text-opacity-30 disabled:border-black disabled:border-opacity-15 disabled:cursor-not-allowed',
                className,
            )}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            <div className="text-white text-2xl w-12 bg-blue-500 flex items-center justify-center mr-2 flex-col">
                <Icon />
            </div>
            <div className="py-4 px-0 flex flex-grow justify-center">
                {children}
            </div>
        </button>
    );
};

export default ToolModalButton;
