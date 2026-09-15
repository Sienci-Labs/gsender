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

import cx from 'classnames';
import { FaExclamation } from 'react-icons/fa';

type Props = {
    active?: boolean;
};

const ActiveIndicator = ({ active = true }: Props) => {
    return (
        <div className="flex items-center w-full justify-end">
            <small className="text-gray-400 text-sm mr-2">
                {active ? 'Active' : 'Not Active'}
            </small>
            <div
                className={cx(
                    'w-8 h-8 rounded-full ml-4 border flex items-center justify-center',
                    {
                        'bg-red-600 border-red-700 animate-pulse': active,
                        'bg-gray-400 border-gray-500': !active,
                    },
                )}
            >
                {active && (
                    <FaExclamation className="text-white animate-bounce" />
                )}
            </div>
        </div>
    );
};

export default ActiveIndicator;
