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

import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';

import { Tooltip } from '@trendmicro/react-tooltip';
import styles from './Overrides.styl';
import GaugeChart from '../GaugeChart';
import { convertMillisecondsToTimeStamp, convertSecondsToTimeStamp } from '../../../lib/datetime';

/**
 * Progress Area component to display running job information
 * @prop {Object} state Default state given from parent component
 *
 */
const ProgressArea = ({ state }) => {
    const { senderStatus } = state;
    const { total, received, elapsedTime, remainingTime, startTime } = senderStatus;

    const getFinishTime = (givenTime) => {
        if (startTime === 0 || !givenTime || givenTime < 0) {
            return '-';
        }

        const now = moment();

        now.add(remainingTime, 'seconds');

        const formattedTime = now.format('h:mma');
        return formattedTime;
    };

    const updateTime = () => {
        return getFinishTime(remainingTime);
    };

    const percentageValue = Number.isNaN(received / total * 100) ? 0 : (received / total * 100).toFixed(0);

    return (
        <div style={{ width: '50%', marginRight: '1rem' }}>
            <div className={styles.progressArea}>
                <div className={styles.progressItemsWrapper}>
                    <div className={styles.progressItem}>
                        <span>Time Cutting</span>
                        <span className={styles.progressItemTime}>{convertMillisecondsToTimeStamp(elapsedTime)}</span>
                        <span style={{ color: 'black' }}>{received} Lines</span>
                    </div>
                    <GaugeChart color="#3e85c7" value={percentageValue} />
                    <div className={styles.progressItem}>
                        <span>Time Remaining</span>
                        <Tooltip
                            content={updateTime}
                            hideOnClick
                        >
                            <span className={styles.progressItemTime}>{convertSecondsToTimeStamp(remainingTime, startTime)}</span>
                        </Tooltip>
                        <span style={{ color: 'black' }}>{total - received} Lines</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
ProgressArea.propTypes = {
    state: PropTypes.object,
};

export default ProgressArea;
