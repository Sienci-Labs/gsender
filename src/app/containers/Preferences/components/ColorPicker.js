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
import Modal from 'app/components/Modal';
import { SketchPicker } from 'react-color';
import styles from '../index.styl';

const ColorPicker = ({ actions, theme, part, isOpen, onClose, chooseColour }) => {
    const [color, setColor] = useState(actions.visualizer.getCurrentColor(theme, part, actions.visualizer.getDefaultColour(part)));
    const [currentPart, setCurrentPart] = useState(part);

    const onOpen = () => {
        if (color !== actions.visualizer.getCurrentColor(theme, part, actions.visualizer.getDefaultColour(part)) && currentPart !== part) {
            setColor(actions.visualizer.getCurrentColor(theme, part, actions.visualizer.getDefaultColour(part)));
            setCurrentPart(part);
        }
        return 1;
    };

    const onCloseModal = () => {
        setCurrentPart(null);
        onClose(color);
    };

    return (
        isOpen && onOpen() && (
            <Modal
                size="xs"
                onClose={onCloseModal}
                className={styles.colorModal}
            >
                <Modal.Header>
                    <Modal.Title>{part}</Modal.Title>
                </Modal.Header>
                <div className={styles.addMargin}>
                    <div id="picker" className={styles.colorPicker}>
                        <SketchPicker
                            id="colorpicker"
                            disableAlpha={true}
                            color={color}
                            onChange={setColor}
                            onChangeComplete={setColor}
                        />
                        <button
                            className={styles.chooseColour}
                            type="button"
                            onClick={() => {
                                chooseColour(color);
                                onClose(color);
                            }}
                        >
                            Choose Colour
                        </button>
                        <button
                            className={styles.resetColour}
                            type="button"
                            onClick={() => setColor(actions.visualizer.getDefaultColour(part))}
                        >
                            Reset to Default
                        </button>
                    </div>
                </div>
            </Modal>
        )
    );
};

export default ColorPicker;
