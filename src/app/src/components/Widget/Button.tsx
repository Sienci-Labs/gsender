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
import { WidgetProps } from './definitions';

const Button = ({ className, inverted, disabled, ...props }: WidgetProps) => {
    return (
        <button
            {...props}
            disabled={disabled}
            className={classNames(
                className,
                'min-w-8 h-8 float-left relative text-sm font-[$font-family-arial] m-0 text-center first:pl-0',
                {
                    'disabled:text-yellow-300 disabled:cursor-not-allowed disabled:hover:bg-inherit':
                        disabled,
                    'text-white bg-gray-800 hover:bg-gray-900': inverted,
                    'opacity-40': disabled && inverted,
                },
            )}
        />
    );
};

export default Button;
