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

const Content: React.FC<WidgetProps> = ({ className, active, ...props }) => (
    <div
        {...props}
        className={classNames(
            className,
            `flex items-stretch border-solid border border-gray-300 dark:border-gray-700 dark:bg-dark
                relative rounded-lg p-2 h-full min-w-80 max-sm:w-full max-sm:min-w-full 
                bg-gray-100 [@media(max-width: 639px),(max-device-width: 639px)]: px-2`,
        )}
    />
);

export default Content;
// export default forwardRef((props, ref) => <Content {...props} reference={ref} />);
//h-[calc(100% - 2rem)]
