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

    const printModals = () => {
        if (isEmpty(modals)) {
            return (
                <div>-</div>
            );
        }
        return (
            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <Tooltip content="Motion" location="default">
                    {modals.motion}
                </Tooltip>
                <Tooltip content="WCS" location="default">
                    {modals.wcs}
                </Tooltip>
                <Tooltip content="Plane" location="default">
                    {modals.plane}
                </Tooltip>
                <Tooltip content="Units" location="default">
                    {modals.units}
                </Tooltip>
                <Tooltip content="Distance" location="default">
                    {modals.distance}
                </Tooltip>
                <Tooltip content="Feedrate" location="default">
                    {modals.feedrate}
                </Tooltip>
                <Tooltip content="Spindle" location="default">
                    {modals.spindle}
                </Tooltip>
                <Tooltip content="Coolant" location="default">
                    {modals.coolant}
                </Tooltip>
                <Tooltip content="Tool" location="default">
                    {modals.tool}
                </Tooltip>
            </div>
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
            <b>{printModals()}</b>
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
