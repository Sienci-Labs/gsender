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

import React from 'react';
import store from 'app/store';
import { get, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import cx from 'classnames';
import styles from '../index.styl';
import pkg from '../../../../../package.json';
import Tooltip from '../../../../components/TooltipCustom/ToolTip';

const ProgramInfo = ({ type, settings, connection, modals }) => {
    const machineProfile = store.get('workspace.machineProfile', {});
    const { company, name, type: machineType } = machineProfile;
    const units = store.get('workspace.units');
    const { port = 'Disconnected', baudrate = 'None' } = connection;

    const determineMovement = () => {
        if (modals.motion === 'G0') {
            return 'Linear (non-extrusion)';
        } else if (modals.motion === 'G1') {
            return 'Linear (extrusion)';
        } else if (modals.motion === 'G2') {
            return 'Arc (Clockwise)';
        } else {
            return 'Arc (Counter-Clockwise)';
        }
    };

    const determinePlane = () => {
        if (modals.plane === 'G17') {
            return 'XY';
        } else if (modals.plane === 'G18') {
            return 'XZ';
        } else {
            return 'YZ';
        }
    };

    const determineSpindle = () => {
        if (modals.spindle === 'M3') {
            return 'Spinning Clockwise';
        } else if (modals.spindle === 'M4') {
            return 'Spinning Counter Clockwise';
        } else {
            return 'Stopped';
        }
    };

    const determineCoolant = () => {
        if (modals.coolant === 'M7') {
            return 'Mist Coolant On';
        } else if (modals.coolant === 'M8') {
            return 'Flood Coolant On';
        } else if (modals.coolant === 'M9') {
            return 'Off';
        } else {
            return 'Mist & Flood Coolant On';
        }
    };

    const printModals = () => {
        if (isEmpty(modals)) {
            return (
                <div>-</div>
            );
        }
        return (
            <b style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <Tooltip
                    content={'Movement: ' + determineMovement()}
                    location="default"
                >
                    {modals.motion}
                </Tooltip>
                <Tooltip
                    content="Current Workspace"
                    location="default"
                >
                    {modals.wcs}
                </Tooltip>
                <Tooltip
                    content={'Plane: ' + determinePlane()}
                    location="default"
                >
                    {modals.plane}
                </Tooltip>
                <Tooltip
                    content={'Units: ' + (modals.distance === 'G21' ? 'Metric' : 'Imperial')}
                    location="default"
                >
                    {modals.units}
                </Tooltip>
                <Tooltip
                    content={'Positioning: ' + (modals.distance === 'G90' ? 'Relative' : 'Absolute')}
                    location="default"
                >
                    {modals.distance}
                </Tooltip>
                <Tooltip
                    content={'Feedrate: ' + (modals.distance === 'G94' ? 'units/min' : 'units/rev')}
                    location="default"
                >
                    {modals.feedrate}
                </Tooltip>
                <Tooltip
                    content={'Spindle: ' + determineSpindle()}
                    location="default"
                >
                    {modals.spindle}
                </Tooltip>
                <Tooltip
                    content={'Coolant: ' + determineCoolant()}
                    location="default"
                >
                    {modals.coolant}
                </Tooltip>
            </b>
        );
    };

    return (
        <div className={cx(styles.card)}>
            <h2>Your Machine</h2>
            <b>gSender {pkg.version}</b>
            <div><b>{type}</b> - {settings.version}</div>
            <h3>Selected Profile</h3>
            <b>{company} {name}</b>
            <div><i>{machineType}</i></div>
            <div><b>Preferred units: </b>{units}</div>
            <h3>Firmware Modals: </h3>
            <div>{printModals()}</div>
            <h3>Connection Info</h3>
            <div><b>Port: </b>{port}</div>
            <div><b>Baudrate: </b>{baudrate}</div>
        </div>
    );
};

export default connect((store) => {
    const type = get(store, 'controller.type', 'Grbl');
    const settings = get(store, 'controller.settings', {});
    const connection = get(store, 'connection', {});
    const modals = get(store, 'controller.state.parserstate.modal', {});
    return {
        type,
        settings,
        connection,
        modals
    };
})(ProgramInfo);
