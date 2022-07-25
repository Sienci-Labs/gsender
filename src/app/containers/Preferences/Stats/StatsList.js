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
import store from 'app/store';
import styles from '../index.styl';
import Fieldset from '../components/Fieldset';

const StatsList = ({ state, actions }) => {
    const jobsFinished = store.get('workspace.jobsFinished');
    const jobsCancelled = store.get('workspace.jobsCancelled');
    const convertMillisecondsToTimeStamp = (milliseconds) => {
        var date = new Date(null);
        date.setSeconds(milliseconds / 1000); // specify value for SECONDS here
        var result = date.toISOString().substring(11, 19);
        return result;
    };
    const timeSpentRunning = convertMillisecondsToTimeStamp(store.get('workspace.timeSpentRunning'));
    const longestTimeRun = convertMillisecondsToTimeStamp(store.get('workspace.longestTimeRun'));
    const jobTimes = store.get('workspace.jobTimes');

    const calculateAverageTimeRun = () => {
        let avgTime = 0;
        for (let i = 0; i < jobTimes.length; i++) {
            avgTime += jobTimes[i];
        }
        avgTime /= jobTimes.length;
        return convertMillisecondsToTimeStamp(avgTime);
    };

    return (
        <Fieldset legend="Statistics">
            <div className={styles.addMargin}>
                <div className={styles.statsContainer}>
                    <span className={[styles.first, styles.bold].join(' ')}>Total Runtime</span>
                    <div className={styles.dotsV2}></div>
                    <span className={[styles.second, styles.bold].join(' ')}>{timeSpentRunning}</span>
                </div>
                <div className={styles.indentContainer}>
                    <div className={styles.statsContainer}>
                        <span className={styles.first}>Longest Runtime</span>
                        <div className={styles.dotsV2}></div>
                        <span className={styles.second}>{longestTimeRun}</span>
                    </div>
                    <div className={styles.statsContainer}>
                        <span className={styles.first}>Average Runtime</span>
                        <div className={styles.dotsV2}></div>
                        <span className={styles.second}>{calculateAverageTimeRun()}</span>
                    </div>
                </div>
                <div className={styles.statsContainer}>
                    <span className={[styles.first, styles.bold].join(' ')}>Total Jobs Run</span>
                    <div className={styles.dotsV2}></div>
                    <span className={[styles.second, styles.bold].join(' ')}>{jobsFinished + jobsCancelled}</span>
                </div>
                <div className={styles.indentContainer}>
                    <div className={styles.statsContainer}>
                        <span className={styles.first}>Jobs Completed</span>
                        <div className={styles.dotsV2}></div>
                        <span className={styles.second}>{jobsFinished}</span>
                    </div>
                    <div className={styles.statsContainer}>
                        <span className={styles.first}>Jobs Cancelled</span>
                        <div className={styles.dotsV2}></div>
                        <span className={styles.second}>{jobsCancelled}</span>
                    </div>
                </div>
            </div>
        </Fieldset>
    );
};

export default StatsList;
