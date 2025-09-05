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
import { Slider } from '../shadcn/Slider';
import { FaMinus, FaPlus, FaUndo } from 'react-icons/fa';
import cx from 'classnames';

import Button from 'app/components/Button';
import Tooltip from '../Tooltip';

export interface RangeSliderProps {
    [key: string]: any;
    title?: string;
    step?: number;
    min?: number;
    max?: number;
    percentage: number[];
    defaultPercentage?: number[];
    value: string;
    showText: boolean; // optional parameter to show text representations of the percentage and to show title
    onChange?: (percentage: number[]) => void;
    onButtonPress?: (percentage: number[]) => void;
    onPointerUp?: PointerEventHandler<HTMLInputElement>;
    unitString?: string;
}

const RangeSlider = ({
    title,
    step = 1,
    min = 0,
    max = 100,
    percentage,
    value,
    defaultPercentage = [...percentage],
    showText,
    colour = 'bg-blue-400',
    onChange = null,
    onButtonPress = null,
    onPointerUp = null,
    unitString = 'unit',
    disabled,
    ...props
}: RangeSliderProps): React.JSX.Element => {
    const textComponent = showText ? (
        <div className="flex flex-row items-center justify-between w-full px-4">
            <span className="w-16 text-left">{title}</span>
            {!disabled && (
                <span className="min-w-4 text-center text-blue-500">{`${value} ${unitString}`}</span>
            )}
            <span className="w-12 text-right">{`${percentage[0]}%`}</span>
        </div>
    ) : (
        <div></div>
    );
    return (
        <div className="flex flex-col items-center gap-2 max-xl:gap-1 justify-center w-full text-gray-900 dark:text-gray-300">
            {textComponent}
            <div className="flex flex-row items-center gap-2 justify-center w-full rounded-full bg-gray-200 dark:bg-dark shadow-inner">
                <Tooltip content={`Reset ${title} override to default value`}>
                    <Button
                        type="button"
                        onClick={() => onButtonPress(defaultPercentage)}
                        disabled={disabled}
                        size="sm"
                        icon={<FaUndo />}
                    />
                </Tooltip>
                <Slider
                    className="flex relative items-center w-full h-6"
                    trackClassName="h-4 bg-gray-400 dark:bg-gray-700 rounded-full relative flex-grow bg-[repeating-linear-gradient(-45deg,transparent,transparent_20px,lightgrey_20px,lightgrey_40px)]"
                    rangeClassName={`absolute h-full rounded-full shadow-inner shadow-gray-400 ${colour}`}
                    thumbClassName={cx(
                        'block w-6 h-6 rounded-xl border-slate-600 border-solid border-2 relative outline-none',
                        {
                            'bg-white': !disabled,
                            'bg-gray-300 ': disabled,
                        },
                    )}
                    defaultValue={defaultPercentage}
                    value={percentage}
                    step={step}
                    min={min}
                    max={max}
                    onValueChange={onChange}
                    onPointerUp={onPointerUp}
                    disabled={disabled}
                    {...props}
                ></Slider>
                <Tooltip content={`Decrease ${title} override by ${step}%`}>
                    <Button
                        type="button"
                        onClick={() => {
                            if (percentage[0] - step < min) {
                                return;
                            }
                            const newValue = percentage[0] - step;
                            onButtonPress([newValue]);
                        }}
                        disabled={disabled}
                        size="sm"
                        icon={<FaMinus />}
                    />
                </Tooltip>
                <Tooltip content={`Increase ${title} override by ${step}%`}>
                    <Button
                        type="button"
                        onClick={() => {
                            if (percentage[0] + step > max) {
                                return;
                            }
                            const newValue = percentage[0] + step;
                            onButtonPress([newValue]);
                        }}
                        disabled={disabled}
                        size="sm"
                        icon={<FaPlus />}
                    />
                </Tooltip>
            </div>
        </div>
    );
};

export default RangeSlider;
