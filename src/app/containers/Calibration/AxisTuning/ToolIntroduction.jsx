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
import styles from '../index.styl';


const axisList = [
    { label: 'X', value: 'x' },
    { label: 'Y', value: 'y' },
    { label: 'Z', value: 'z' },
];

const ToolIntroduction = ({ readyHandler, currentAxis, onSelectAxis, isConnected }) => {
    const buttonText = isConnected ? 'Ready to start' : 'You must be connected to a device';

    return (
        <ReduxProvider store={reduxStore}>
            <div className={styles.toolIntro}>
                <p>
                    All CNCs ship with standard settings so the controller knows how much to turn the motors in order to move 1mm,
                     a factor of the specs of the motors and the pitch of the lead screws.
                </p>

                <p>
                    Manufacturing tolerances can make these presets inaccurate, meaning a move of 200mm could move 200.5mm in reality.
                    If you’re looking to use your CNC for more accurate work or run a diagnosis, this tool is for you.
                </p>

                <p>Before starting, you’ll want to have a marker or some tape on hand and a measuring tape to keep track of machine movements.</p>

                <div style={{ marginBottom: '1rem' }}>
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
                </div>

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
