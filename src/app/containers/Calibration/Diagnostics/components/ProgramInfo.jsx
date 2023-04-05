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
import { get } from 'lodash';
import { connect } from 'react-redux';
import cx from 'classnames';
import styles from '../index.styl';
import pkg from '../../../../../package.json';

const ProgramInfo = ({ type, settings, connection }) => {
    const machineProfile = store.get('workspace.machineProfile', {});
    const { company, name, type: machineType } = machineProfile;
    const units = store.get('workspace.units');
    const { port = 'Disconnected', baudrate = 'None' } = connection;

    return (
        <div className={cx(styles.card)}>
            <h2>Your Machine</h2>
            <b>gSender {pkg.version}</b>
            <div><b>{type}</b> - {settings.version}</div>
            <h3>Selected Profile</h3>
            <b>{company} {name}</b>
            <div><i>{machineType}</i></div>
            <div><b>Preferred units: </b>{units}</div>
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
    return {
        type,
        settings,
        connection
    };
})(ProgramInfo);
