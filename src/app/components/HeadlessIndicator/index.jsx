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
import { Toaster, TOASTER_SUCCESS, TOASTER_WARNING } from 'app/lib/toaster/ToasterLib';
import Tooltip from '../TooltipCustom/ToolTip';
import HeadlessConfig from './HeadlessConfig';
import store from '../../store';
import styles from './index.styl';


const HeadlessIndicator = ({ address, port }) => {
    const [showConfig, setShowConfig] = useState(false);
    const [headlessMode, setHeadlessMode] = useState(false);
    const [currentPort, setCurrentPort] = useState(0); //TODO - set this on app load
    const [ipList, setIpList] = useState([{}]);
    const [currentIp, setCurrentIp] = useState(''); //TODO - set this on app load

    const handleShowConfig = () => {
        setShowConfig(true);
    };
    const updateHeadlessStatus = () => {
        setHeadlessMode(!headlessMode);
    };
    const updatePort = (event) => {
        setCurrentPort(event.target.value);
    };
    //handles enter key press in IP address input field
    const handleEnterKey = (event) => {
        if (event.keyCode === 13) {
            setCurrentIp({ value: event.target.value, label: event.target.value });
            event.target.blur();
        }
    };
    const copyToClipboard = () => {
        navigator.clipboard.writeText(`${address}:${port}`);
        Toaster.pop({
            msg: 'Address copied',
            type: TOASTER_SUCCESS,
        });
    };
    const updateRemotePreferences = () => {
    //Validations
        //Port
        //Only values between 1025 and 65535
        if (currentPort.value < 1025 || currentPort.value > 65535) {
            Toaster.pop({
                msg: 'Invalid port',
                type: TOASTER_WARNING,
            });
            return;
        }
        //IP
        // 210.110 – must have 4 octets
        // y.y.y.y – format allowed
        // 255.0.0.y – format allowed
        // 666.10.10.20 – digits must be between [0-255]
        if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(currentIp.value)) {
            Toaster.pop({
                msg: 'Invalid IP Address',
                type: TOASTER_WARNING,
            });
            return;
        }

        //Update settings logic
        //If remote mode toggle is off, clear current IP and port
        //else restart application
        if (!headlessMode) {
            setCurrentIp('');
            setCurrentPort(0);
        }

        //Save port and IP in .sender_rc
        store.set('remotePort', currentPort);
        store.set('remoteIp', currentIp);

        //TODO - Backend logic


        Toaster.pop({
            msg: 'Changes saved, app will restart.',
            type: TOASTER_SUCCESS,
        });
        setShowConfig(false);

        //TODO- Restart app here with new changes
    };

    //refresh IP list on reload
    useEffect(() => {
        setIpList([{ value: 'todo IP', label: 'todo IP' }]);//TODO - fetch real data
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
                    <div>Remote:
                        <span className={styles.ip}>{address}:{port}</span>
                    </div>
                )
                : ''
            }
            <HeadlessConfig
                show={showConfig}
                title="Connection Configuration"
                onClose={() => {
                    setShowConfig(false);
                }}
            >
                <div className={styles.configContentWrapper}>
                    <div className={styles.toggleWrapper}>
                        <span>Remote Mode:</span>
                        <Switch
                            checked={headlessMode}
                            onChange={updateHeadlessStatus}
                        />
                        {
                            !port
                                ? (
                                    <span
                                        className={styles.copyAddress} onClick={copyToClipboard}
                                        tabIndex={-2}
                                        onKeyDown={() => {
                                            return;
                                        }}
                                        role="button"
                                    >
                                        <i className="fa fa-copy" /> Copy remote address
                                    </span>
                                )
                                : ''
                        }
                    </div>
                    <div className={styles.connectionWrapper}>
                        Please choose your remote IP and Port Bellow: <br />
                        {/* <div className={styles.inputWrapper}>

                            <Select />
                        </div> */}
                        <div className={styles.inputWrapper}>
                            <div className={styles.titles}>
                                <div className={styles.titleIp}>IP: &#32;</div>
                                <div className={styles.titlePort}>Port: &#32;</div>
                            </div>
                            <div className={styles.inputs}>
                                <Select
                                    placeholder="select or type IP"
                                    value={currentIp}
                                    options={ipList}
                                    onChange={(event) => {
                                        setCurrentIp(event);
                                    }}
                                    onKeyDown={(event) => handleEnterKey(event)}
                                />
                                <div className={styles.portInput}>
                                    <input
                                        type="number"
                                        value={currentPort}
                                        min={0}
                                        onChange={updatePort}
                                        placeholder="port number"
                                    />
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
