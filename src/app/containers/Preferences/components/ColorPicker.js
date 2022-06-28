/*
 * Copyright (C) 2022 Sienci Labs Inc.
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

import React, { useState } from 'react';
import { BlockPicker } from 'react-color';
import { LIGHT_THEME, CUST_DARK_THEME, CUST_LIGHT_THEME } from 'app/widgets/Visualizer/constants';
import styles from '../index.styl';

const ColorPicker = ({ state, actions }) => {
    const [color, setColor] = useState('#000000');
    const { theme } = state.visualizer;
    return (
        <div className={styles.addMargin}>
            <button
                id="backbutton"
                className={styles.addTool}
                type="button"
                onClick={function () {
                    document.getElementById('picker').style.display = 'inline';
                    document.getElementById('backbutton').style.display = 'none';
                }}
            >
            Customize Background
            </button>
            <div id="picker" className={styles.addMargin} style={{ display: 'none' }}>
                <BlockPicker
                    id="colorpicker"
                    color={color}
                    onChange={setColor}
                    onChangeComplete={actions.visualizer.handleChangeComplete}
                />
                <button
                    className={styles.addTool}
                    type="button"
                    onClick={function () {
                        let newTheme;
                        if (theme === LIGHT_THEME || theme === CUST_LIGHT_THEME) {
                            newTheme = CUST_LIGHT_THEME;
                        } else {
                            newTheme = CUST_DARK_THEME;
                        }
                        actions.visualizer.handleCustThemeChange(newTheme);
                    }}
                >
                Save
                </button>
            </div>
        </div>
    );
};

export default ColorPicker;
