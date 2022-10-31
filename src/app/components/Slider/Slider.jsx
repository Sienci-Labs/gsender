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

const Slider = ({ step = 1, min = 0, max = 100, value, onChange = null, onMouseUp = null, label = '', unitString = 'unit' }) => {
    return (
        <div className={styles.sliderWrapper}>
            <span style={{ width: '13%' }}>{label + ' '}</span>
            <input
                style={{ width: '70%' }}
                type="range" min={min} max={max}
                value={value} onMouseUp={onMouseUp} className={styles.slider}
                onChange={onChange}
                step={step}
            />
            <span style={{ width: '17%' }}>{ value } { unitString }</span>
        </div>
    );
};

export default Slider;
