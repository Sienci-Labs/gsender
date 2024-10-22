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

import classNames from 'classnames';
import React from 'react';
import { WidgetProps } from './definitions';

const Header: React.FC<WidgetProps> = ({
    fixed,
    className,
    embedded = false,
    ...props
}) => (
    <div
        {...props}
        className={classNames(
            className,
            'bg-gray-200 relative border-gray-400 text-gray-900',
            {
                'cursor-default': fixed,
                hidden: embedded,
            },
        )}
    />
);

export default Header;
