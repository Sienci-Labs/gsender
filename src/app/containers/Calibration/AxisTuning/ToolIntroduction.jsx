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
import Select from 'react-select';
import get from 'lodash/get';

import reduxStore from 'app/store/redux';
import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';
import JogControl from 'app/widgets/JogControl';

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
                    If you’re looking to use your CNC for more accurate work and notice a specific axis is always off by a small amount - say 102mm instead of 100 - then use this tool.
                </p>

                <p>
                    Since CNC firmware needs to understand its hardware to make exact movements, small manufacturing variations in the motors, lead screws, pulleys, or incorrect firmware will create inaccuracies over longer distances.
                </p>

                <p>By testing for this difference using a marker or tape and a measuring tape, this tool will better tune the firmware to your machine.</p>

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
            </div>

            <div>
                <JogControl widgetId="jogcontrol" isSecondary />
            </div>
            <ToolModalButton icon="fas fa-play" primary disabled={!isConnected} onClick={readyHandler}>{ buttonText }</ToolModalButton>
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
