import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { VscError } from 'react-icons/vsc';
import { BsAlarm } from 'react-icons/bs';
import { getAllErrors } from '../helper';
import styles from '../../index.styl';

const ErrorLog = () => {
    const [logs, setLogs] = useState(getAllErrors() || []);

    const colorCodes = {
        ALARM: '#d75f5f',
        ERROR: '#ff0000'
    };

    useEffect(() => {
        setLogs(getAllErrors() || ['Nothing to display']);
    }, []);

    return (
        <div className={styles.errorWrapper}>
            <div className={styles.errorHeading}>
                Recent errors and alarms
            </div>
            <div className={styles.errorBody}>
                { logs[0] !== 'Nothing to display'
                    ? (
                        <VerticalTimeline layout="1-column-left" className={styles.verticalTimeline}>
                            {
                                logs.map((log, index) => {
                                    return log.toLowerCase().includes('alarm')
                                        ? (
                                            <VerticalTimelineElement
                                                className="vertical-timeline-element--work"
                                                contentStyle={{ height: 'auto', borderTop: `5px solid ${colorCodes.ALARM}` }}
                                                contentArrowStyle={{ top: '50%' }}
                                                date="Oct 20 2022"
                                                iconStyle={{ top: '41%', background: colorCodes.ALARM, color: '#fff' }}
                                                icon={<BsAlarm />}
                                                key={index}
                                            >
                                                <h5 className="vertical-timeline-element-title">Alarm</h5>
                                                <p>
                                                    Reason: {log}
                                                </p>
                                            </VerticalTimelineElement>
                                        )
                                        : (
                                            <VerticalTimelineElement
                                                className="vertical-timeline-element--work"
                                                contentStyle={{ height: 'auto', borderTop: `5px solid ${colorCodes.ERROR}` }}
                                                contentArrowStyle={{ top: '50%' }}
                                                date="Oct 22 2022"
                                                iconStyle={{ top: '41%', background: colorCodes.ERROR, color: '#fff' }}
                                                icon={<VscError />}
                                                key={index}
                                            >
                                                <h5 className="vertical-timeline-element-subtitle">Error</h5>
                                                <p>
                                                    Reason: {log}
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
