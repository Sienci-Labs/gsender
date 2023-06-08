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

import React, { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames';

import Button from 'app/components/FunctionButton/FunctionButton';
import controller from 'app/lib/controller';
import Modal from 'app/components/ToolModal/ToolModal';
import i18n from 'app/lib/i18n';
import { Toaster, TOASTER_SUCCESS, TOASTER_DANGER } from 'app/lib/toaster/ToasterLib';

import styles from './serverdisconnected.styl';

let connectionTimeout;

const ServerDisconnected = ({ reason, onClose }) => {
    const [reconnectLoading, setReconnectLoading] = useState(false);

    useEffect(() => {
        return () => {
            clearTimeout(connectionTimeout);
        };
    }, []);

    const handleReconnect = () => {
        setReconnectLoading(true);
        controller.reconnect();

        connectionTimeout = setTimeout(() => {
            if (controller.connected) {
                Toaster.pop({
                    msg: 'Server Reconnected Succesfully',
                    type: TOASTER_SUCCESS,
                });
            } else {
                Toaster.pop({
                    msg: 'Could Not Reconnect to Server',
                    type: TOASTER_DANGER,
                });
            }

            setReconnectLoading(false);
        }, 3000);
    };

    const status = useMemo(() => ({
        'connect': {
            icon: 'fas fa-times-circle',
            iconStyle: styles.errorIcon,
            title: 'Server Connection Lost',
            details: 'It looks like the server connection has been lost, attempt to reconnect?',
            showReconnectButton: true,
            allowModalClose: true,
        },
        'connect_error': {
            icon: 'fas fa-times-circle',
            iconStyle: styles.errorIcon,
            title: 'Server Connection Error',
            details: 'It looks like there was a problem connecting to the server, attempt to reconnect?',
            showReconnectButton: true,
            allowModalClose: true,
        },
        'disconnect': {
            icon: 'fas fa-times-circle',
            iconStyle: styles.errorIcon,
            title: 'Server Disconnected',
            details: 'It looks like you have been disconnected from the server, attempt to reconnect?',
            showReconnectButton: true,
            allowModalClose: true,
        },
    }[reason || 'connect']));

    return (
        <Modal
            size="sm"
            title="Server Connection"
            showCloseButton={status.allowModalClose}
            disableOverlayClick={!status.allowModalClose}
            onClose={onClose}
        >
            <div className={styles.wrapper}>
                <i className={classNames(status.icon, status.iconStyle)} />

                <h3 className={styles.title}>{status.title}</h3>

                <p className={styles.details}>{i18n._(status.details)}</p>

                {status.showReconnectButton && (
                    <Button
                        primary
                        disabled={controller.connected || reconnectLoading}
                        onClick={handleReconnect}
                        className={styles.primaryButton}
                    >
                        {i18n._(reconnectLoading ? 'Reconnecting...' : 'Reconnect to Server')}
                    </Button>
                )}
            </div>
        </Modal>
    );
};

export default ServerDisconnected;
