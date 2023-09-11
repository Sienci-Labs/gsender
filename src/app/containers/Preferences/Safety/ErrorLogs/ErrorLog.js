import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { VscError } from 'react-icons/vsc';
import { BsAlarm } from 'react-icons/bs';
import uniqueID from 'lodash/uniqueId';
import styles from '../../index.styl';
import api from 'app/api';
import { ALARM } from '../../../../constants';
import { convertISOStringToDateAndTime } from '../../../../lib/datetime';

const ErrorLog = () => {
    const [logs, setLogs] = useState([]);

    const colorCodes = {
        ALARM: '#d75f5f',
        ERROR: '#ff0000'
    };

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
                { logs.length !== 0
                    ? (
                        <VerticalTimeline animate={false} layout="1-column-left" className={styles.verticalTimeline}>
                            {
                                logs.map((log, index) => {
                                    const [date, time] = convertISOStringToDateAndTime(log.time);
                                    return (
                                        <VerticalTimelineElement
                                            className={`vertical-timeline-element--work ${styles.marginUpdate}`}
                                            contentStyle={{ height: 'auto', borderTop: `5px solid ${colorCodes[log.type]}` }}
                                            contentArrowStyle={{ top: '42%' }}
                                            iconStyle={{ top: '31%', background: colorCodes[log.type], color: '#fff' }}
                                            dateClassName={styles.inbuiltDate}
                                            icon={log.type === ALARM ? <BsAlarm /> : <VscError />}
                                            key={uniqueID()}
                                        >
                                            <span className={styles.errorTag}>{log.type}{log.source && ` - ${log.source}`}</span>
                                            <span className={styles.errorDate}>
                                                {`On ${date} at ${time}`}
                                            </span>
                                            <p className={styles.errorReason}>
                                                {`${log.type} ${log.CODE} - ${log.MESSAGE}`} <br />
                                                {
                                                    log.line && (
                                                        log.source !== 'Console' ? `Line ${log.lineNumber}: ` : 'Line: '
                                                    )
                                                }
                                                {log.line}
                                            </p>
                                        </VerticalTimelineElement>
                                    );
                                }).reverse()
                            }
                        </VerticalTimeline>
                    )
                    : (
                        <div className={styles.noErrors}>
                            No history of alarms or errors
                        </div>
                    )
                }
            </div>
        </div>
    );
};

ErrorLog.protoTypes = {
    errors: PropTypes.object,
};

export default ErrorLog;
