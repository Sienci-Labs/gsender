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

import chainedFunction from 'chained-function';
import PropTypes from 'prop-types';
import React from 'react';
import api from '../../../api';
import { Button } from 'app/components/Buttons';
import ModalTemplate from 'app/components/ModalTemplate';
import Modal from 'app/components/Modal';
import i18n from 'app/lib/i18n';
import { uniqueId } from 'lodash';
import styles from './maintenancealert.styl';

const MaintenanceAlert = (props) => {
    let alertTasks = [];
    props.tasks.forEach((task) => {
        const { rangeStart, currentTime } = task;
        if (currentTime >= rangeStart) {
            alertTasks.push(task);
        }
    });

    return (
        <Modal
            size="sm"
            disableOverlayClick
            showCloseButton={false}
        >
            <Modal.Header>
                <ModalTemplate type="warning">
                    <h3>Maintenance Alert</h3>
                </ModalTemplate>
            </Modal.Header>
            <Modal.Body>
                <p>{i18n._('The following maintenance tasks are due:')}</p>
                <span className={styles.statsWrapper}>
                    {
                        alertTasks.map((task) => {
                            return <span key={uniqueId()}>{'• ' + i18n._(task.name) + '\n'}</span>;
                        })
                    }
                </span>
                <p>{i18n._('Click \'Reset Timers\' to reset the timers on ALL listed tasks. Click \'Close\' to close the popup and do nothing.')}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    className="pull-left"
                    btnStyle="danger"
                    onClick={chainedFunction(
                        () => {
                            const updatedTasks = props.tasks.map((task) => {
                                const { rangeStart, currentTime } = task;
                                if (currentTime >= rangeStart) {
                                    let newTask = task;
                                    newTask.currentTime = 0;
                                    return newTask;
                                }
                                return task;
                            });
                            api.maintenance.update(updatedTasks);
                        },
                        props.onClose
                    )}
                >
                    {i18n._('Reset Timers')}
                </Button>
                <Button
                    onClick={props.onClose}
                >
                    {i18n._('Close')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

MaintenanceAlert.propTypes = {
    tasks: PropTypes.array,
    onClose: PropTypes.func
};

export default MaintenanceAlert;
