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
import { Provider as ReduxProvider } from 'react-redux';
import reduxStore from 'app/store/redux';

import SettingWrapper from '../components/SettingWrapper';
import GeneralArea from '../components/GeneralArea';
import ErrorLog from './ErrorLogs/ErrorLog';

import VisualizerSafety from './VisualizerSafety';
import Movement from './Movement';
import WorkspaceSafety from './WorkspaceSafety';

const SafetySettings = ({ active, state, actions }) => {
    return (
        <SettingWrapper title="Safety" show={active}>
            <ReduxProvider store={reduxStore}>
                <GeneralArea>
                    <GeneralArea.Half>
                        <WorkspaceSafety state={state} actions={actions} />
                        <VisualizerSafety state={state} actions={actions} />
                    </GeneralArea.Half>
                    <GeneralArea.Half>
                        <Movement state={state} actions={actions} />
                    </GeneralArea.Half>
                </GeneralArea>
                <ErrorLog />
            </ReduxProvider>
        </SettingWrapper>
    );
};

export default SafetySettings;
