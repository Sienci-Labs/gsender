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

import React, { useState, useEffect } from 'react';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Select from 'react-select';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import Tooltip from '../TooltipCustom/ToolTip';
import HeadlessConfig from './HeadlessConfig';
import styles from './index.styl';


const HeadlessIndicator = ({ address, port }) => {
    const defaultHeadlessSettings = { ip: { value: '', label: '' }, port: 8000, headlessStatus: false };
    const defaultErrorMessage = { ipError: '', portError: '' };
    const [showConfig, setShowConfig] = useState(false);
    const [headlessSettings, setHeadlessSettings] = useState(defaultHeadlessSettings); //TODO - set IP and PORT on app load
    const [settingErrors, setSettingErrors] = useState(defaultErrorMessage);
    const [ipList, setIpList] = useState([{ value: '', label: '' }]);

    const handleShowConfig = () => {
        setShowConfig(true);
        setSettingErrors(defaultErrorMessage);
    };
    //handles enter key press in IP address input field
    const handleEnterKey = (event) => {
        if (event.keyCode === 13) {
            setHeadlessSettings({ ...headlessSettings, ip: { value: event.target.value, label: event.target.value } });
            setSettingErrors({ ...settingErrors, ipError: '' });
            event.target.blur();
        }
    };
    //handles any change on IP, PORT and Headless toggle
    const handleInputChanges = (event) => {
        //handle select
        if (!event.target) {
            setHeadlessSettings({ ...headlessSettings, ip: event });
            return;
        }
        const { name, value } = event.target;
        //Reset errors when user starts typing
        name === 'ip' ? setSettingErrors({ ...settingErrors, ipError: '' }) : setSettingErrors({ ...settingErrors, portError: '' });
        //handle toggle change
        if (name === 'headlessStatus') {
            setHeadlessSettings({ ...headlessSettings, headlessStatus: !headlessSettings.headlessStatus });
            setSettingErrors(defaultErrorMessage);
            return;
        }

        //Save new setting
        setHeadlessSettings({ ...headlessSettings, [name]: value });
    };
    const copyToClipboard = () => {
        navigator.clipboard.writeText(`${address}:${port}`);
        Toaster.pop({
            msg: 'Address copied',
            type: TOASTER_SUCCESS,
        });
    };
    const validateInputs = () => {
        if (!headlessSettings.headlessStatus) {
            //TODO - if user changed from toggle ON to OFF, send a restart command with new settings


            setShowConfig(false);
            //Else don't do anything when user hits OK button
            return true;
        }
        const errors = defaultErrorMessage;
        let hasError = false;
        //Port
        //Only values between 1025 and 65535
        if (headlessSettings.port < 1025 || headlessSettings.port > 65535) {
            errors.portError = 'Please enter a valid port number';
            hasError = true;
        }
        //IP
        // 210.110 – must have 4 octets
        // y.y.y.y – format allowed
        // 255.0.0.y – format allowed
        // 666.10.10.20 – digits must be between [0-255]
        if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(headlessSettings.ip.value)) {
            errors.ipError = 'Invalid IP Address';
            hasError = true;
        }
        setSettingErrors(errors);
        return hasError;
    };
    const updateRemotePreferences = () => {
        //Validations
        if (validateInputs()) {
            return;
        }
        //Update settings logic
        //If remote mode toggle is off, clear current IP and port
        if (!headlessSettings.headlessStatus) {
            setHeadlessSettings(defaultHeadlessSettings);
        }

        //TODO - Save port and IP in .sender_rc (even if empty)


        setShowConfig(false);
        //TODO - pop a confirmation box only if settings changed


        //TODO- Restart app here with new changes or don't do anything if no changes made
    };

    //refresh IP list on reload
    useEffect(() => {
        setIpList([{ value: '', label: '' }]);//TODO - fetch real data
    }, []);

    return (
        <div className={styles.wrapper}>
            <Tooltip content="Remote mode" placement="bottom" enterDelay={0}>
                <div
                    className={styles.remoteAlert}
                    style={port ? '' : { background: '#747474' }}
                    role="button"
                    tabIndex={-3}
                    onClick={handleShowConfig}
                    onKeyDown={handleShowConfig}
                >
                    <i className="fa fa-satellite-dish" />
                </div>
            </Tooltip>
            {port
                ? (
                    <div>
                        <span
                            className={styles.ip}
                            onClick={copyToClipboard}
                            tabIndex={-2}
                            onKeyDown={() => {
                                return;
                            }}
                            role="button"
                        >Remote: {address}:{port}
                        </span>
                    </div>
                )
                : ''
            }
            <HeadlessConfig
                show={showConfig}
                title="Remote Mode Configuration"
                onClose={() => {
                    setShowConfig(false);
                }}
            >
                <div className={styles.configContentWrapper}>
                    <div className={styles.toggleWrapper}>
                        <span>Enable Remote Mode:</span>
                        <Switch
                            name="headlessStatus"
                            checked={headlessSettings.headlessStatus}
                            onChange={handleInputChanges}
                        />
                    </div>
                    <div className={styles.connectionWrapper}>
                        Please choose your remote IP and Port Bellow: <br />
                        <div className={styles.inputWrapper}>
                            <div className={styles.titles}>
                                <div className={styles.titleIp}>IP: &#32;</div>
                                <div className={styles.titlePort}>Port: &#32;</div>
                            </div>
                            <div className={styles.inputs}>
                                <div className={styles.ipInput}>
                                    <Select
                                        name="ip"
                                        placeholder="select or type IP"
                                        value={headlessSettings.ip}
                                        options={ipList} //{value: , label: }
                                        onChange={handleInputChanges}
                                        onKeyDown={(event) => handleEnterKey(event)}
                                        isDisabled={!headlessSettings.headlessStatus}
                                        className={settingErrors.ipError ? styles.invalidInput : ''}
                                        styles={{
                                            container: base => ({
                                                ...base,
                                                width: '15rem',
                                            })
                                        }}
                                    />
                                    {settingErrors.ipError ? <span className={styles.warningText}> <i className="fa fa-exclamation-circle" /> {settingErrors.ipError} </span> : ''}
                                </div>
                                <div className={styles.portInput}>
                                    <input
                                        name="port"
                                        type="number"
                                        value={headlessSettings.port}
                                        min={0}
                                        onChange={handleInputChanges}
                                        placeholder="port number"
                                        disabled={!headlessSettings.headlessStatus}
                                        className={settingErrors.portError ? styles.invalidInput : ''}
                                    />
                                    {settingErrors.portError ? <span className={styles.warningText}> <i className="fa fa-exclamation-circle" /> {settingErrors.portError} </span> : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.warningWrapper}>
                        <b>Warning: </b> Clicking &ldquo;OK&ldquo; will restart the app with new settings.<br />
                        Please make sure to save all your tasks before your proceed.
                    </div>
                    <div className={styles.footer}>
                        <div className={styles.buttonWrapper}>
                            <Button variant="contained" onClick={updateRemotePreferences}>OK</Button>
                        </div>
                    </div>
                </div>
            </HeadlessConfig>
        </div>
    );
};

export default HeadlessIndicator;
