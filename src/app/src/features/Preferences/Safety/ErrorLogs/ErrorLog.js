import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import 'react-vertical-timeline-component/style.min.css';

import api from 'app/api';

import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import LogList from './LogList';
import styles from '../../index.styl';

const ErrorLog = () => {
    const [logs, setLogs] = useState([]);

    const fetchLogs = async () => {
        const res = await api.alarmList.fetch();
        const { list } = res.body;

        setLogs(list || []);
    };

    const onDelete = () => {
        Confirm({
            title: 'Delete History',
            content: 'Are you sure you want to delete all alarm/error history?',
            confirmLabel: 'Confirm',
            cancelLabel: 'Cancel',
            onConfirm: async () => {
                await api.alarmList.clearAll().then((res) => {
                    fetchLogs();
                });
            }
        });
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className={styles.errorWrapper}>
            <div className={styles.errorHeading}>
                { `Errors and Alarms (${logs.length})`}
                <div
                    className="flex items-center gap-1"
                    style={{ display: 'flex', alignItems: 'center', float: 'right' }}
                >
                    <i
                        title="Delete History"
                        onClick={onDelete}
                        tabIndex={-1}
                        role="button"
                        size={5}
                        className={cx('far fa-trash-alt', styles.deleteIcon)}
                    />
                </div>
            </div>

            <div className={styles.errorBody}>
                <LogList logs={logs} />
            </div>
        </div>
    );
};

ErrorLog.protoTypes = {
    errors: PropTypes.object,
};

export default ErrorLog;
