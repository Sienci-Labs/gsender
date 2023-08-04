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

import React, { useEffect, useState } from 'react';
import styles from '../index.styl';
import Fieldset from '../components/Fieldset';
import jobActions from './components/jobApiActions';

const StatsList = ({ state, actions }) => {
    // const [data, setData] = useState({});
    const [jobsFinished, setJobsFinished] = useState([]);
    const [jobsCancelled, setJobsCancelled] = useState([]);
    const [totalRuntime, setTotalRuntime] = useState(0);
    const [averageTime, setAverageTime] = useState(0);
    const [longestTime, setLongestTime] = useState(0);

    useEffect(() => {
        console.log('api call');
        jobActions.fetch(null, setJobsFinished, setJobsCancelled, setTotalRuntime).then((data) => {
            // calc longest time run and average run time
            let allJobTimes = 0;
            let longestTime = 0;
            data.jobs.forEach(job => {
                allJobTimes += job.duration;
                if (job.duration > longestTime) {
                    longestTime = job.duration;
                }
            });
            setAverageTime(allJobTimes / data.jobs.length);
            setLongestTime(longestTime);
        });
    }, []);

    // solution found here: https://stackoverflow.com/a/25279340
    const convertMillisecondsToTimeStamp = (milliseconds) => {
        if (milliseconds) {
            let date = new Date(null);
            date.setSeconds(milliseconds / 1000);
            let result = date.toISOString().substring(11, 19);
            return result;
        }
        return null;
    };

    return (
        <Fieldset legend="Statistics" className={styles.addMargin}>
            <div className={styles.addMargin}>
                <div className={styles.statsContainer}>
                    <span className={[styles.first, styles.bold].join(' ')}>Total Runtime</span>
                    <div className={styles.dotsV2} />
                    <span className={[styles.second, styles.bold].join(' ')}>{convertMillisecondsToTimeStamp(totalRuntime)}</span>
                </div>
                <div className={styles.indentContainer}>
                    <div className={styles.statsContainer}>
                        <span className={styles.first}>Longest Runtime</span>
                        <div className={styles.dotsV2} />
                        <span className={styles.second}>{convertMillisecondsToTimeStamp(longestTime)}</span>
                    </div>
                    <div className={styles.statsContainer}>
                        <span className={styles.first}>Average Runtime</span>
                        <div className={styles.dotsV2} />
                        <span className={styles.second}>{convertMillisecondsToTimeStamp(averageTime)}</span>
                    </div>
                </div>
                <div className={styles.statsContainer}>
                    <span className={[styles.first, styles.bold].join(' ')}>Total Jobs Run</span>
                    <div className={styles.dotsV2} />
                    <span className={[styles.second, styles.bold].join(' ')}>{jobsFinished + jobsCancelled}</span>
                </div>
                <div className={styles.indentContainer}>
                    <div className={styles.statsContainer}>
                        <span className={styles.first}>Jobs Completed</span>
                        <div className={styles.dotsV2} />
                        <span className={styles.second}>{jobsFinished}</span>
                    </div>
                    <div className={styles.statsContainer}>
                        <span className={styles.first}>Jobs Cancelled</span>
                        <div className={styles.dotsV2} />
                        <span className={styles.second}>{jobsCancelled}</span>
                    </div>
                </div>
            </div>
        </Fieldset>
    );
};

export default StatsList;
