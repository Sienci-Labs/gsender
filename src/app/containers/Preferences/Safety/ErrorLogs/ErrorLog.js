import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { VscError } from 'react-icons/vsc';
import { BsAlarm } from 'react-icons/bs';
import uniqueID from 'lodash/uniqueId';
import { getAllErrors } from '../helper';
import styles from '../../index.styl';

const ErrorLog = () => {
    const [logs, setLogs] = useState([]);

    const colorCodes = {
        ALARM: '#d75f5f',
        ERROR: '#ff0000'
    };

    useEffect(() => {
        const fetchLogs = async () => {
            const data = await getAllErrors();
            setLogs(data);
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
                        <VerticalTimeline layout="1-column-left" className={styles.verticalTimeline}>
                            {
                                logs.map((log, index) => {
                                    return log.toLowerCase().includes('alarm')
                                        ? (
                                            <VerticalTimelineElement
                                                className={`vertical-timeline-element--work ${styles.marginUpdate}`}
                                                contentStyle={{ height: 'auto', borderTop: `5px solid ${colorCodes.ALARM}` }}
                                                contentArrowStyle={{ top: '42%' }}
                                                iconStyle={{ top: '31%', background: colorCodes.ALARM, color: '#fff' }}
                                                dateClassName={styles.inbuiltDate}
                                                icon={<BsAlarm />}
                                                key={uniqueID()}
                                            >
                                                <span className={styles.errorTag}>Alarm</span>
                                                <span className={styles.errorDate}>
                                                    On {log.split('[error] GRBL_ALARM:')[0].slice(1, 20).replace(' ', ' at ') || ''}
                                                </span>
                                                <p className={styles.errorReason}>
                                                    {log.split('[error] GRBL_ALARM:')[1]}
                                                </p>
                                            </VerticalTimelineElement>
                                        )
                                        : (
                                            <VerticalTimelineElement
                                                className={`vertical-timeline-element--work ${styles.marginUpdate}`}
                                                contentStyle={{ height: 'auto', borderTop: `5px solid ${colorCodes.ERROR}` }}
                                                contentArrowStyle={{ top: '42%' }}
                                                iconStyle={{ top: '31%', background: colorCodes.ERROR, color: '#fff' }}
                                                dateClassName={styles.inbuiltDate}
                                                icon={<VscError />}
                                                key={uniqueID()}
                                            >
                                                <span className={styles.errorTag}>Error{log.split('[error] GRBL_ERROR:')[1].split('Origin')[1]}</span>
                                                <span className={styles.errorDate}>
                                                    On {log.split('[error] GRBL_ERROR:')[0].slice(1, 20).replace(' ', ' at ') || ''}
                                                </span>
                                                <p className={styles.errorReason}>
                                                    {log.split('[error] GRBL_ERROR:')[1].split('Line')[0]} <br />
                                                    {log.includes('Feeder') ? '' : ('Line ' + log.split('[error] GRBL_ERROR:')[1].split('Line')[1].split('Origin')[0])} <br />
                                                </p>
                                            </VerticalTimelineElement>
                                        );
                                })
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
