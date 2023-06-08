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
import styles from './slider.styl';

const Slider = ({ sliderName = 'stepper', step = 1, min = 0, max = 100, value, onChange = null, onMouseUp = null, unitString = 'unit', datalist, ...props }) => {
    return (
        <div className={styles.sliderWrapper}>
            <div className={styles.sliderContainer}>
                <input
                    type="range" min={min} max={max}
                    list={sliderName + 'list'}
                    id={sliderName}
                    name={sliderName}
                    className={styles.slider}
                    value={value}
                    onMouseUp={onMouseUp}
                    onChange={onChange}
                    step={step}
                    {...props}
                />
                {/* these ticks are shown */}
                <div className={styles.sliderticks}>
                    {
                        datalist &&
                            [...Array(max - min)].map((e, i) => {
                                // if the min isnt 0, need to calculate the slider number
                                const index = i + min;
                                if (index % step === 0 && datalist.includes(index)) {
                                    return <p></p>;
                                } else {
                                    return <div></div>;
                                }
                            })
                    }
                </div>
            </div>
            {/* datalist ticks wont be seen (we have webkit appearance turned off),
                but they will add the sticky functionality */}
            <datalist id={sliderName + 'list'} >
                {
                    datalist.map(data => {
                        return <option key={sliderName + 'list' + data} value={data} />;
                    })
                }
            </datalist>
            <span>{value}{unitString}</span>
        </div>
    );
};

export default Slider;
