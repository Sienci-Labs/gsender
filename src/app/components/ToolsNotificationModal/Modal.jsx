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

/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/prop-types */
import React, { useContext, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import machineProfiles from 'app/containers/Firmware/components/defaultMachineProfiles';
import Select from 'react-select';
import './modal.css';
import controller from 'app/lib/controller';
import store from 'app/store';
import reduxStore from 'app/store/redux';
import _get from 'lodash/get';
import { FirmwareContext } from '../../containers/Firmware/utils';

const ToolsNotificationModal = ({ onClose, show, title, children, footer, footerTwo, yesFunction, showOptions }) => {
    const { machineProfile } = useContext(FirmwareContext);
    const getMachineProfileLabel = ({ name, type }) => `${name} ${type && type}`.trim();
    const [port, setPort] = useState(controller.port);
    const [profileId, setProfileId] = useState(machineProfile);

    const [portList, setPortList] = useState(_get(reduxStore.getState(), 'connection.ports'));

    //Refresh port and clear state variables if machine disconnected
    const refreshPorts = () => {
        controller.listPorts();
        setPortList(_get(reduxStore.getState(), 'connection.ports') || []);
        if (port !== '' && portList.findIndex((p) => {
            return p.port === port;
        }) === -1) {
            setPort('');
            setProfileId(-1);
        }
    };

    const handleYes = () => {
        refreshPorts();
        const foundProfile = machineProfiles.find(machineProfile => machineProfile.id === profileId);

        if (foundProfile) {
            const newProfile = {
                ...foundProfile,
                limits: {
                    xmin: 0,
                    ymin: 0,
                    zmin: 0,
                    xmax: foundProfile.mm.width,
                    ymax: foundProfile.mm.depth,
                    zmax: foundProfile.mm.height,
                }
            };
            store.replace('workspace.machineProfile', newProfile);
            controller.command('machineprofile:load', newProfile);
        }
        yesFunction(port, machineProfile);
    };

    return (
        <CSSTransition
            in={show}
            unmountOnExit
            timeout={{ enter: 0, exit: 300 }}
        >
            <div className={`modalFirmware ${show ? 'show' : ''}`} onClick={onClose}>
                <div
                    className="modal-content" onClick={e => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div className="fas fa-exclamation-triangle" style={{ fontSize: '1.3rem', color: 'red', textAlign: 'center', marginLeft: '0.6rem' }} />
                        <h4 className="modal-title">{title}</h4>
                    </div>
                    <div className="modal-body">{children}</div>
                    {showOptions ? (
                        <div
                            className="optionsWrapper"
                        >
                            <div
                                className="port"
                                onMouseEnter={refreshPorts}
                                onMouseLeave={refreshPorts}
                            >
                                <span style={{ width: '14%', lineHeight: '2.5rem' }}>Port: </span>
                                <Select
                                    placeholder="select"
                                    styles={{
                                        placeholder: (base) => ({
                                            ...base,
                                            fontSize: '1em',
                                            color: '#D3D3D3',
                                            fontWeight: 400,
                                        }),
                                    }}
                                    value={port ? { value: port, label: port } : ''}
                                    options={portList.map((element) => {
                                        return { value: element.port, label: element.port };
                                    })}
                                    onChange={(e) => {
                                        setPort(e.value);
                                    }}
                                />
                            </div>
                            <div className="profile">
                                <span style={{ width: '14%', lineHeight: '2.5rem' }}>Profile: </span>
                                <Select
                                    options={
                                        machineProfiles
                                            .sort((a, b) => getMachineProfileLabel(a).localeCompare(getMachineProfileLabel(b)))
                                            .map(({ id, name, type }) => ({ key: id, value: id, label: getMachineProfileLabel({ name, type }) }))
                                    }
                                    defaultValue={{ value: machineProfile, label: getMachineProfileLabel(machineProfile) }}
                                    onChange={(e) => {
                                        setProfileId(e.value);
                                    }}
                                    clearable={false}
                                />
                            </div>
                        </div>
                    ) : ''}
                    <div className="modal-footer">
                        <h1 className="footer-text">{footer}</h1>
                        <h1 className="footer-textTwo">{footerTwo}</h1>
                        <div className="buttonContainer">
                            <button onClick={onClose} className="button-no">No</button>
                            <button
                                className="button" onClick={handleYes}
                                onMouseEnter={refreshPorts}
                                onMouseLeave={refreshPorts}
                            >Yes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </CSSTransition>
    );
};

export default ToolsNotificationModal;
