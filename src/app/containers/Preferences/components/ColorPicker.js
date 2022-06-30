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

import React, { useState, useEffect } from 'react';
import { SketchPicker } from 'react-color';
import { LIGHT_THEME, CUST_DARK_THEME, CUST_LIGHT_THEME } from 'app/widgets/Visualizer/constants';
import pubsub from 'pubsub-js';
import styles from '../index.styl';

const ColorPicker = ({ actions, theme, part }) => {
    const [color, setColor] = useState(actions.visualizer.getCurrentBackground(part.value, actions.visualizer.getDefaultColour(theme, part.value)));

    pubsub.subscribe('theme:change', () => {
        setColor(actions.visualizer.getCurrentBackground(part.value, actions.visualizer.getDefaultColour(theme, part.value)));
    });
    pubsub.subscribe('part:change', () => {
        setColor(actions.visualizer.getCurrentBackground(part.value, actions.visualizer.getDefaultColour(theme, part.value)));
    });

    // clean the state in the unmount
    useEffect(() => {
        return () => {
            setColor();
        };
    }, []);

    return (
        <div className={styles.addMargin}>
            {(theme === CUST_DARK_THEME || theme === CUST_LIGHT_THEME) &&
                <div id="picker" className={styles.colourPicker}>
                    <SketchPicker
                        id="colorpicker"
                        disableAlpha={true}
                        color={color}
                        onChange={setColor}
                        onChangeComplete={(color) => actions.visualizer.handleChangeComplete(color, part.value)}
                    />
                    <button
                        className={styles.saveColour}
                        type="button"
                        onClick={() => {
                            let newTheme;
                            if (theme === LIGHT_THEME || theme === CUST_LIGHT_THEME) {
                                newTheme = CUST_LIGHT_THEME;
                            } else {
                                newTheme = CUST_DARK_THEME;
                            }
                            actions.visualizer.handleCustThemeChange(newTheme, part.value);
                        }}
                    >
                    Save
                    </button>
                    <button
                        className={styles.resetColour}
                        type="button"
                        onClick={() => actions.visualizer.resetCustomThemeColours(theme)}
                    >
                    Reset Colours
                    </button>
                </div>
            }
        </div>
    );
};

export default ColorPicker;
