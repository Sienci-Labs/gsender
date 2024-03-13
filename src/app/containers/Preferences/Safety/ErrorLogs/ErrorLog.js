import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import 'react-vertical-timeline-component/style.min.css';

import api from 'app/api';

import LogList from './LogList';
import styles from '../../index.styl';

const ErrorLog = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            const res = await api.alarmList.fetch();
            const { list } = res.body;

            setLogs(list || []);
        };
        fetchLogs();
    }, []);

    return (
        <div className={styles.errorWrapper}>
            <div className={styles.errorHeading}>
                { `Errors and Alarms (${logs.length})`}
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
