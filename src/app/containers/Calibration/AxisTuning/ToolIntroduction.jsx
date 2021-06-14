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
import { Provider as ReduxProvider } from 'react-redux';
import reduxStore from 'app/store/redux';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import Select from 'react-select';

const axisList = [
    { label: 'X', value: 'x' },
    { label: 'Y', value: 'y' },
    { label: 'Z', value: 'z' },
];

const ToolIntroduction = ({ readyHandler, currentAxis, onSelectAxis }) => {
    return (
        <ReduxProvider store={reduxStore}>
            <div>
                <p>We&apos;ll be moving your machine in a linear direction for each of the axis.</p>
                <p>You will need to make a few marks on a piece of tape and place them on your machines wasteboard.</p>
                <p>In addition, your cutting tool should be as pointy as possible for maximum accuracy when measuring distances.</p>
                <p>When jogging, please make sure it is in a position where it will not hit the machine limits.</p>

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

                <FunctionButton primary onClick={readyHandler}>Ready to start!</FunctionButton>
            </div>
        </ReduxProvider>
    );
};

ToolIntroduction.propTypes = {
    readyHandler: PropTypes.func
};

export default ToolIntroduction;
