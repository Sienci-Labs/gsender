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
import FunctionButton from 'app/components/FunctionButton/FunctionButton';

import Keypad from '../JogControl';

const ToolIntroduction = ({ readyHandler, isConnected }) => {
    const buttonText = isConnected ? 'Ready to start' : 'You must be connected to a device';
    return (
        <>
            <div>
                <p>We&apos;ll be making a triangle to help align your machine.</p>
                <p>You will need to make a few marks on a piece of tape and place them on your machines wasteboard</p>
                <p>In addition, your cutting tool should be as pointy as possible for maximum accuracy when measuring distances.</p>
                <p>Please jog your machine to the back left before beginning.</p>

                <Keypad />
            </div>
            <FunctionButton primary disabled={!isConnected} onClick={readyHandler} style={{ marginTop: '2rem' }}>{ buttonText }</FunctionButton>
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
