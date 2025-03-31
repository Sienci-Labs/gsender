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

import { ChangeEvent } from 'react';

type Props = {
    step?: number;
    min?: number;
    max?: number;
    value?: number;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    label?: string;
    unitString?: string;
};

const Slider = ({
    step = 1,
    min = 0,
    max = 100,
    value = 50,
    onChange = null,
    label = 'Range',
    unitString = 'RPM',
}: Props) => {
    return (
        <div className="grid grid-cols-[1fr_3fr_1fr] mt-4 items-center gap-2 justify-center dark:text-white">
            <span className="text-right">{label}:</span>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={onChange}
                className="appearance-none h-4 rounded-md bg-gray-300 outline-none transition-opacity duration-200 ease-in-out dark:bg-dark-lighter"
                step={step}
            />
            <span>
                {value} {unitString}
            </span>
        </div>
    );
};

export default Slider;
