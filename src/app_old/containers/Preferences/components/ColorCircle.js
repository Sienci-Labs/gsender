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

import React, { useEffect } from 'react';
import pubsub from 'pubsub-js';
import styles from '../index.styl';

const ColorCircle = ({ part, onClick, colour, index }) => {
    let pubsubTokens = [];

    useEffect(() => {
        document.getElementById('colorButton' + index).style.backgroundColor = colour;
        subscribe();
        return function cleanup() {
            unsubscribe();
        };
    }, []);

    const subscribe = () => {
        const tokens = [
            pubsub.subscribe('colour:change', (msg, data) => {
                const { currentPart, newColour } = data;
                if (currentPart === part) {
                    document.getElementById('colorButton' + index).style.backgroundColor = newColour.hex ? newColour.hex : newColour;
                }
            })
        ];
        pubsubTokens = pubsubTokens.concat(tokens);
    };

    const unsubscribe = () => {
        pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        pubsubTokens = [];
    };

    return (
        <button id={'colorButton' + index} type="button" className={styles.colorButton} />
    );
};

export default ColorCircle;
