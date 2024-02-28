import React from 'react';
import { VerticalTimeline } from 'react-vertical-timeline-component';
import uniqueID from 'lodash/uniqueId';

import ErrorItem from './ErrorItem';
import { convertISOStringToDateAndTime } from '../../../../lib/datetime';

import styles from '../../index.styl';

const LogList = ({ logs }) => {
    if (!logs || logs?.length === 0) {
        return (
            <div className={styles.noErrors}>
                No history of alarms or errors
            </div>
        );
    }

    return (
        <VerticalTimeline animate={false} layout="1-column-left" className={styles.verticalTimeline}>
            {
                logs.map((log) => {
                    const [date, time] = convertISOStringToDateAndTime(log.time);

                    const key = uniqueID();

                    return (
                        <ErrorItem
                            log={log}
                            date={date}
                            time={time}
                            key={key}
                        />
                    );
                })
            }
        </VerticalTimeline>
    );
};

export default LogList;
