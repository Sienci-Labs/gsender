import React from 'react';
import { VscError } from 'react-icons/vsc';
import { BsAlarm } from 'react-icons/bs';
import { VerticalTimelineElement } from 'react-vertical-timeline-component';

import { ALARM } from 'app/constants';

import styles from '../../index.styl';

const colorCodes = {
    ALARM: '#d75f5f',
    ERROR: '#ff0000'
};

const ErrorItem = ({ log, date, time }) => {
    return (
        <VerticalTimelineElement
            className={`vertical-timeline-element--work ${styles.marginUpdate}`}
            contentStyle={{ height: 'auto', borderTop: `5px solid ${colorCodes[log.type]}` }}
            contentArrowStyle={{ top: '42%' }}
            iconStyle={{ top: '31%', background: colorCodes[log.type], color: '#fff' }}
            dateClassName={styles.inbuiltDate}
            icon={log.type === ALARM ? <BsAlarm /> : <VscError />}
        >
            <span className={styles.errorTag}>{log.type} - {log.source}</span>
            <span className={styles.errorDate}>
                {`On ${date} at ${time}`}
            </span>
            <p className={styles.errorReason}>
                {`${log.type} ${log.CODE} - ${log.MESSAGE}`} <br />
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p>
                    {
                        log.line && (
                            log.source !== 'Console' && log.source !== 'Feeder' ? `Line ${log.lineNumber}: ` : 'Line: '
                        )
                    }
                    {log.line}
                </p>
                <p style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '0 1rem', fontWeight: 'bold' }}>{log.controller}</p>
            </div>
        </VerticalTimelineElement>
    );
};

export default ErrorItem;
