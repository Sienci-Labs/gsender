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
import PropTypes from 'prop-types';
import { Provider as ReduxProvider, connect } from 'react-redux';
import reduxStore from 'app/store/redux';
import get from 'lodash/get';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import Select from 'react-select';
import Keypad from '../JogControl';


const axisList = [
    { label: 'X', value: 'x' },
    { label: 'Y', value: 'y' },
    { label: 'Z', value: 'z' },
];

const ToolIntroduction = ({ readyHandler, currentAxis, onSelectAxis, isConnected }) => {
    const buttonText = isConnected ? 'Ready to start' : 'You must be connected to a device';

    return (
        <ReduxProvider store={reduxStore}>
            <div>
                <p>We&apos;ll be moving your machine in a linear direction to calculate the motor steps.</p>
                <p>You will need to make a few marks on a piece of tape and place them on your machines wasteboard or rail.</p>
                <p>When jogging, please make sure it is in a position where it will not hit the machine limits.</p>
                <b>Axis to calculate steps for:</b>
                <br />
                <Select
                    backspaceRemoves={false}
                    className="sm"
                    clearable={false}
                    menuContainerStyle={{ zIndex: 5 }}
                    name="toolchangeoption"
                    onChange={(selected) => onSelectAxis(selected.value)}
                    options={axisList}
                    value={{ label: currentAxis.toUpperCase(), value: currentAxis }}
                />
                <br />
                <Keypad />


            </div>
            <FunctionButton primary disabled={!isConnected} onClick={readyHandler}>{ buttonText }</FunctionButton>
        </ReduxProvider>
    );
};

ToolIntroduction.propTypes = {
    readyHandler: PropTypes.func
};

export default connect((store) => {
    const isConnected = get(store, 'connection.isConnected');
    return {
        isConnected
    };
})(ToolIntroduction);
