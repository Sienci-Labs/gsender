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

// import cx from 'classnames';
import React from 'react';
// import Slider from 'rc-slider';
import { RangeSliderProps } from '../../definitions/interfaces/range_slider';
// import 'rc-slider/assets/index.css';

const RangeSlider = ({
    sliderName = 'stepper',
    step = 1,
    min = 0,
    max = 100,
    value,
    onChange = null,
    onMouseUp = null,
    unitString = 'unit',
    ...props
}: RangeSliderProps): React.JSX.Element => {
    return (
        <div className="flex grid-cols-[4fr_1fr] items-center gap-2 justify-center w-full">
            <input
                type="range" min={min} max={max}
                list={sliderName + 'list'}
                id={sliderName}
                name={sliderName}
                // className={cx("h-2.5 rounded outline-0 duration-75",
                //     "[&::-webkit-slider-thumb]: appearance-none [&::-webkit-slider-thumb]: w-6 [&::-webkit-slider-thumb]: [height:24px] [&::-webkit-slider-thumb]: rounded-md [&::-webkit-slider-thumb]: cursor-pointer [&::-webkit-slider-thumb]: -mt-2 [&::-webkit-slider-thumb]: relative [&::-webkit-slider-thumb]: z-1 [&::-webkit-slider-thumb]: opacity-80 [&::-webkit-slider-thumb]: duration-75",
                //     "[&::-moz-range-thumb]: w-6 [&::-moz-range-thumb]: h-6 [&::-webkit-slider-thumb]: cursor-pointer",
                //     "[&::-webkit-slider-runnable-track]: min-w-20 [&::-webkit-slider-runnable-track]: h-2 [&::-webkit-slider-runnable-track]: rounded-md [&::-webkit-slider-runnable-track]: bg-slate-500 [&::-webkit-slider-runnable-track]: bg-[linear-gradient(135deg,_rgba(255,_255,_255,_.15)_25%,_transparent_25%,_transparent_50%,_rgba(255,_255,_255,_.15)_50%,_rgba(255,_255,_255,_.15)_75%,_transparent_75%,_transparent)]"
                // )}
                className="slider slider-progress"
                value={value}
                onMouseUp={onMouseUp}
                onChange={onChange}
                step={step}
                {...props}
            />
            {/* <Slider
                range
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={onChange}
                onChangeComplete={onChangeComplete}
                styles={{
                    rail: {
                        backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent)' 
                    },
                    track: {
                        background: 'blue'
                    }
                }}
                {...props}
            /> */}
            <span className="min-w-4 text-right">{value}{unitString}</span>
        </div>
    );
};

export default RangeSlider;
