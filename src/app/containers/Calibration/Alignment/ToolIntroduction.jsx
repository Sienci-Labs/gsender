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
import { connect } from 'react-redux';
import get from 'lodash/get';
import PropTypes from 'prop-types';

import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';
import JogControl from 'app/widgets/JogControl';


const ToolIntroduction = ({ readyHandler, isConnected }) => {
    const buttonText = isConnected ? 'Ready to start' : 'You must be connected to a device';

    return (
        <>
            <div style={{ fontSize: '1.1rem', lineHeight: '1.25', marginTop: '1rem', color: 'grey' }}>
                <p>
                    If your y-axis hardstops or endstops aren&apos;t &apos;in-line&apos; when you autosquare your CNC manually or during
                    homing then it will skew the x-axis and produce off-square cuts (see the picture). You can fix this by shimming the y-axis plates, realigning the y-axes,
                    or tuning the dual endstops if your CNC has autosquaring.
                </p>

                <p>
                    To know how much adjustment is needed, prepare:
                </p>

                <ul>
                    <li>Something pointed in the router like an old tapered bit, v-bit, or a dowel</li>
                    <li>3 squares of tape marked with an &apos;X&apos;</li>
                    <li>A long ruler or measuring tape</li>
                    <li>The CNC positioned somewhere in the front, left corner with the pointed tip close to the wasteboard</li>
                </ul>
            </div>
            <div>
                <JogControl widgetId="axes" isSecondary />
            </div>
            <ToolModalButton icon="fas fa-play" disabled={!isConnected} onClick={readyHandler}>{ buttonText }</ToolModalButton>
        </>
    );
};

ToolIntroduction.propTypes = {
    readyHandler: PropTypes.func,
    isConnected: PropTypes.bool
};

export default connect((store) => {
    const isConnected = get(store, 'connection.isConnected');
    return {
        isConnected
    };
})(ToolIntroduction);
