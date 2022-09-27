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
import { FirmwareContext } from '../../containers/Firmware/utils';

const ToolsNotificationModal = (props) => {
    const { machineProfile } = useContext(FirmwareContext);

    const { onClose, show, title, children, footer, footerTwo, yesFunction, showOptions } = props;
    const getMachineProfileLabel = ({ name, type }) => `${name} ${type && type}`.trim();
    const [port, setPort] = useState(controller.port);
    const [profile, setProfile] = useState(getMachineProfileLabel(machineProfile));

    return (
        <CSSTransition
            in={props.show}
            unmountOnExit
            timeout={{ enter: 0, exit: 300 }}
        >
            <div className={`modalFirmware ${show ? 'show' : ''}`} onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="fas fa-exclamation-triangle" style={{ fontSize: '1.3rem', color: 'red', textAlign: 'center', marginLeft: '0.6rem' }} />
                        <h4 className="modal-title">{title}</h4>
                    </div>
                    <div className="modal-body">{children}</div>
                    {showOptions ? (
                        <div className="optionsWrapper">
                            <div className="port">
                                <span style={{ width: '14%', lineHeight: '2.5rem' }}>Port: </span>
                                <Select
                                    defaultValue={{ value: port, label: port }}
                                    options={controller.ports.map((element) => {
                                        return { value: element.port, label: element.port };
                                    })}
                                    clearable={false}
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
                                    defaultValue={{ value: profile, label: profile }}
                                    onChange={(e) => {
                                        setProfile(e.value);
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
                                className="button" onClick={() => {
                                    yesFunction(port, profile);
                                }}
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
