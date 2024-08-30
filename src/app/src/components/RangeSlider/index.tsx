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

import React, { PointerEventHandler } from 'react';
import * as Slider from '@radix-ui/react-slider';

export interface RangeSliderProps {
    [key: string]: any,
    title?: string,
    step?: number,
    min?: number,
    max?: number,
    value: number[],
    defaultValue?: number[],
    showValues: boolean // optional parameter to show text representations of the value and to show title
    onChange?: (value: number[]) => void,
    onPointerUp?: PointerEventHandler<HTMLInputElement>,
    unitString?: string,
}

const RangeSlider = ({
    title,
    step = 1,
    min = 0,
    max = 100,
    value,
    defaultValue = [...value],
    showValues,
    colour = 'blue',
    onChange = null,
    onPointerUp = null,
    unitString = 'unit',
    ...props
}: RangeSliderProps): React.JSX.Element => {
    const textComponent = showValues ? (
            <div className="flex flex-row items-center justify-between w-full px-4">
                <span className="min-w-4 text-right">{title}</span>
                <span className="min-w-4 text-right text-blue-500">{`${value[0]} ${unitString}`}</span>
                <span className="min-w-4 text-right">{`${(((value[0] - min) / (max - min)) * 100).toFixed(0)}%`}</span>
            </div>
        ) : <div></div>;
    return (
        <div className="flex flex-col items-center gap-2 justify-center w-full">
            {textComponent}
            <div className="flex flex-row items-center gap-2 justify-center w-full rounded-full bg-gray-200 shadow-inner">
                <button
                    type="button"
                    className="flex w-10 h-7 items-center justify-center rounded-s-3xl rounded-e-none text-center p-1 m-0 font-bold border-solid border-[1px] border-blue-400 bg-white bg-opacity-60 text-black"
                    onClick={() => onChange(defaultValue)}
                >
                    <i className="fas fa-redo"></i>
                </button>
                <Slider.Root
                    className="flex relative items-center w-full h-6"
                    defaultValue={defaultValue}
                    value={value}
                    step={step}
                    min={min}
                    max={max}
                    onValueChange={onChange}
                    onPointerUp={onPointerUp}
                    {...props}
                >
                    <Slider.Track
                        className="h-4 bg-gray-400 rounded-full relative flex-grow bg-[repeating-linear-gradient(-45deg,transparent,transparent_20px,lightgrey_20px,lightgrey_40px)]"
                    >
                        <Slider.Range className={`absolute h-full rounded-full bg-[${colour}]`}/>
                    </Slider.Track>
                    <Slider.Thumb 
                        className="block w-6 h-6 rounded-xl border-slate-600 border-solid border-2 cursor-pointer relative bg-white outline-none"
                    />
                </Slider.Root>
                <button
                    type="button"
                    className="flex w-10 h-7 items-center justify-center rounded-s-3xl rounded-e-none text-center p-1 m-0 font-bold border-solid border-[1px] border-blue-400 bg-white bg-opacity-60 text-black"
                    onClick={() => {
                        if (value[0] - step < min) {
                            return;
                        }
                        const newValue = value[0] - step;
                        onChange([newValue]);
                    }}
                >
                    <i className="fas fa-minus"></i>
                </button>
                <button
                    type="button"
                    className="flex w-10 h-7 items-center justify-center rounded-e-3xl rounded-s-none text-center p-1 m-0 font-bold border-solid border-[1px] border-blue-400 bg-white bg-opacity-60 text-black"
                    onClick={() => {
                        if (value[0] + step > max) {
                            return;
                        }
                        const newValue = value[0] + step;
                        onChange([newValue]);
                    }}
                >
                    <i className="fas fa-plus"></i>
                </button>
            </div>
        </div>
    );
};

export default RangeSlider;
