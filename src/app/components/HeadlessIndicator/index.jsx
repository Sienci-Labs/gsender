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
import reduxStore from 'app/store/redux';
import Switch from '@mui/material/Switch';
import Button from 'app/components/FunctionButton/FunctionButton';
import Creatable from 'react-select/creatable';
import _ from 'lodash';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import actions from './apiActions';
import Tooltip from '../TooltipCustom/ToolTip';
import DialogBox from './DialogBox';
import controller from '../../lib/controller';
import styles from './index.styl';


const HeadlessIndicator = ({ address, port }) => {
    const defaultHeadlessSettings = { ip: '0.0.0.0', port: 8000, headlessStatus: false };
    const defaultErrorMessage = { ipError: '', ipHint: '', portError: '', portHint: '' };
    const [showConfig, setShowConfig] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [headlessSettings, setHeadlessSettings] = useState(defaultHeadlessSettings);
    const [oldSettings, setOldSettings] = useState(defaultHeadlessSettings);
    const [settingErrors, setSettingErrors] = useState(defaultErrorMessage);
    const [ipList, setIpList] = useState(['']);
    const [shouldRestart, setShouldRestart] = useState(false);//controls if app should restart when user hits OK

    const handleShowConfig = () => {
        setShowConfig(true);
        setSettingErrors(defaultErrorMessage);
    };
    const validateInputs = ({ name, value }) => {
        if (!headlessSettings.headlessStatus) {
            return false;
        }
        const errors = defaultErrorMessage;
        let hasError = false;

        switch (name) {
        //IP
        // 210.110 – must have 4 octets
        // y.y.y.y – format allowed
        // 255.0.0.y – format allowed
        // 666.10.10.20 – digits must be between [0-255]
        default:
        case 'ip':
            if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)) {
                errors.ipError = 'Invalid IP Address';
                errors.ipHint = 'Ip addresses should consist of 4 sets of numbers between 0 and 255 following the pattern X.X.X.X';
                hasError = true;
            }
            break;
        case 'port':
            //Port
        //Only values between 1025 and 65535
            if (value < 1025 || value > 65535) {
                errors.portError = 'Please enter a valid port number';
                errors.portHint = 'A port number should range between 1025 and 65535';
                hasError = true;
            }
            break;
        }

        setSettingErrors(errors);
        return hasError;
    };
    //handles enter key press in IP address input field
    const handleEnterKey = (event) => {
        if (event.keyCode === 13) {
            setHeadlessSettings({ ...headlessSettings, ip: event.target.value });
            validateInputs(event.target);
            if (settingErrors.ipError) {
                setHeadlessSettings({ ...headlessSettings, ip: oldSettings.ip });
                setSettingErrors({ ...settingErrors, ipError: '', ipHint: '' });
            }
        }
    };
    //handles any change on IP, PORT and Headless toggle
    const handleInputChanges = (event) => {
        //handle select
        if (!event.target) {
            setHeadlessSettings({ ...headlessSettings, ip: event.value });
            validateInputs({ name: 'ip', value: event.value });
            return;
        }
        const { name, value } = event.target;
        //Reset errors when user starts typing
        name === 'ip' ? setSettingErrors({ ...settingErrors, ipError: '', ipHint: '' }) : setSettingErrors({ ...settingErrors, portError: '', portHint: '' });
        //handle toggle change
        if (name === 'headlessStatus') {
            setHeadlessSettings({ ...headlessSettings, headlessStatus: !headlessSettings.headlessStatus });
            setSettingErrors(defaultErrorMessage);
            return;
        }
        validateInputs(event.target);
        //Save new setting
        setHeadlessSettings({ ...headlessSettings, [name]: Number(value) });
    };
    const copyToClipboard = () => {
        //Copy to electron clipboard
        const text = `http://${address}:${port}`;
        window.ipcRenderer.send('copy-clipboard', text);
    };

    const updateRemotePreferences = () => {
        if (headlessSettings.ip === '') {
            setSettingErrors({ ...setSettingErrors, ipError: 'Invalid IP Address', ipHint: 'Ip addresses should consist of 4 sets of numbers between 0 and 255 following the pattern X.X.X.X' });
            return;
        }
        //Update settings logic
        //If remote mode toggle is off, clear current IP and port
        if (!headlessSettings.headlessStatus) {
            setHeadlessSettings(defaultHeadlessSettings);
        }

        setShowConfig(false);

        //pop a confirmation box only if settings changed
        if (!_.isEqual(oldSettings, headlessSettings)) {
            setShowConfirmation(true);
            setShouldRestart(true);
        } else {
            setHeadlessSettings(oldSettings);
            Toaster.pop({
                msg: 'No settings were changed.',
                type: TOASTER_INFO,
            });
        }
    };

    const handleAppRestart = (action) => {
        if (action === 'cancel') {
            setShowConfirmation(false);
            setShouldRestart(true);
            return;
        }
        //Save port and IP in .sender_rc (even if empty)
        actions.saveSettings(headlessSettings); // This will restart electron
        setOldSettings(headlessSettings);

        setShouldRestart(false);
        setShowConfirmation(false);
    };

    //refresh IP list on reload
    useEffect(() => {
        actions.fetchSettings(setHeadlessSettings, setOldSettings);
    }, []);
    useEffect(() => {
        controller.listAllIps();
        const ipList = _.get(reduxStore.getState(), 'preferences.ipList');
        let formattedIpList = [];

        ipList.forEach((ip) => {
            formattedIpList.push({ value: ip, label: ip });
        });
        setIpList(formattedIpList);
    }, [headlessSettings, _.get(reduxStore.getState(), 'preferences.ipList')]);

    return (
        <div className={styles.headlessWrapper}>
            <Tooltip content="Remote mode" placement="bottom" enterDelay={0}>
                <div
                    className={styles.remoteAlert}
                    style={oldSettings.headlessStatus ? { background: '#06B881' } : { background: '#747474' }}
                    role="button"
                    tabIndex={-3}
                    onClick={handleShowConfig}
                    onKeyDown={handleShowConfig}
                >
                    <i className="fa fa-satellite-dish" />
                </div>
            </Tooltip>
            {oldSettings.headlessStatus
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
            {
                shouldRestart ? (
                    <div
                        className={styles.restartLabel} onClick={() => setShowConfirmation(true)} role="button"
                        tabIndex={-3}
                        onKeyDown={() => {
                            return;
                        }}
                    >App restart pending
                    </div>
                ) : ''
            }
            {/* Headless config dialog */}
            <DialogBox
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
                        Please choose your remote IP and Port below: <br />
                        <div className={styles.inputWrapper}>
                            <div className={styles.ipInput}>
                                <span className={styles.titleIp}>IP: &#32;</span>
                                <Creatable
                                    name="ip"
                                    placeholder="select or type IP"
                                    value={{ value: headlessSettings.ip, label: headlessSettings.ip }}
                                    options={ipList} //{value: , label: }
                                    onChange={handleInputChanges}
                                    onBlur={
                                        () => {
                                            if (settingErrors.ipError) {
                                                setHeadlessSettings({ ...headlessSettings, ip: oldSettings.ip });
                                                setSettingErrors({ ...settingErrors, ipError: '', ipHint: '' });
                                            }
                                        }
                                    }
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
                            {settingErrors.ipHint ? (
                                <div className={styles.hints}>
                                    {settingErrors.ipHint}
                                </div>
                            ) : ''}
                            <div className={styles.portInput}>
                                <span className={styles.titlePort}>Port: &#32;</span>
                                <input
                                    name="port"
                                    type="number"
                                    value={headlessSettings.port}
                                    min={0}
                                    onChange={handleInputChanges}
                                    onBlur={
                                        () => {
                                            if (settingErrors.portError) {
                                                setHeadlessSettings({ ...headlessSettings, port: oldSettings.port });
                                                setSettingErrors({ ...settingErrors, portError: '', portHint: '' });
                                            }
                                        }
                                    }
                                    placeholder="port number"
                                    disabled={!headlessSettings.headlessStatus}
                                    className={settingErrors.portError ? styles.invalidInput : ''}
                                />
                                {settingErrors.portError ? <span className={styles.warningText}> <i className="fa fa-exclamation-circle" /> {settingErrors.portError} </span> : ''}
                                {settingErrors.portHint ? (
                                    <div className={styles.hints}>
                                        {settingErrors.portHint}
                                    </div>
                                ) : ''}
                            </div>
                        </div>
                    </div>
                    <div className={styles.warningWrapper}>
                        <b>Warning: </b> Any changes to remote mode settings will require a restart of the application before taking effect.  You will be prompted to restart on clicking &quot;OK&quot;
                    </div>
                    <div className={styles.changes}>
                        <b>Remote Address: </b> {headlessSettings.headlessStatus ? `${headlessSettings.ip}:${headlessSettings.port}` : 'Headless mode disabled.'}
                    </div>
                    <div className={styles.footer}>
                        <div className={styles.buttonWrapper}>
                            <Button primary onClick={updateRemotePreferences}>OK</Button>
                        </div>
                    </div>
                </div>
            </DialogBox>
            {/* Restart confirmation dialog */}
            <Confirm
                title="Restart app?"
                content="Note: You are about to restart the app with new settings. Please make sure you save all the changes before you proceed."
                onClose={() => handleAppRestart('cancel')}
                onConfirm={() => handleAppRestart('ok')}
                confirmLabel="Restart now"
                cancelLabel="Restart later"
                show={showConfirmation}
            />
        </div>
    );
};

export default HeadlessIndicator;
