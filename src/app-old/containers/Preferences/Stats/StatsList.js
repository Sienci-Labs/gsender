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
import Select from 'react-select';
import { isEmpty, map } from 'lodash';
import api from 'app/api';
import { convertMillisecondsToTimeStamp } from 'app/lib/datetime';
import SortableTable from 'app/components/SortableTable/SortableTable';
import styles from './index.styl';
import {
    STATS_PAGES,
    OVERALL_STATS,
    JOB_PER_PORT,
    RUN_TIME_PER_PORT,
    USAGE_TOOL_NAME
} from '../../../constants';
import { collectUserUsageData } from '../../../lib/heatmap';

const columnData = {
    jobsPerPort: [
        {
            accessorKey: 'port',
            header: () => 'Port',
        },
        {
            accessorKey: 'numJobs',
            header: () => '# of Jobs',
        },
    ],
    runTimePerPort: [
        {
            accessorKey: 'port',
            header: () => 'Port',
        },
        {
            accessorKey: 'runTime',
            header: () => 'Run Time',
            cell: (info) => {
                const date = new Date(null);
                date.setMilliseconds(Number(info.renderValue()));
                return date.toISOString().slice(11, 19);
            },
        },
    ]
};

const StatsList = () => {
    const [statsPages, setStatsPages] = useState({});
    const [page, setPage] = useState(JOB_PER_PORT);

    useEffect(() => {
        api.jobStats.fetch().then((res) => {
            const data = res.body;
            // calc longest time run and average run time
            let allJobTimes = 0;
            let longestTime = 0;
            let jobsPerPort = {};
            let runTimePerPort = {};
            data.jobs.forEach(job => {
                // jobs per port
                if (!jobsPerPort[job.port]) {
                    jobsPerPort[job.port] = 0;
                }
                jobsPerPort[job.port] += 1;
                // run time per port
                if (!runTimePerPort[job.port]) {
                    runTimePerPort[job.port] = 0;
                }
                runTimePerPort[job.port] += job.duration;
                // all job times + longest time
                allJobTimes += job.duration;
                if (job.duration > longestTime) {
                    longestTime = job.duration;
                }
            });
            const portJobData = Object.entries(jobsPerPort).map(([port, data]) => {
                return { port: port, numJobs: data };
            });
            const portRunTimeData = Object.entries(runTimePerPort).map(([port, data]) => {
                return { port: port, runTime: data };
            });
            const averageTime = allJobTimes / data.jobs.length;

            const allStats = {
                totalRuntime: data.totalRuntime,
                jobsFinished: data.jobsFinished,
                jobsCancelled: data.jobsCancelled,
                averageTime: averageTime,
                longestTime: longestTime,
                jobsPerPort: portJobData,
                runTimePerPort: portRunTimeData
            };

            setStatsPages(getStatsPages(allStats));
        });

        const timeout = setTimeout(() => {
            collectUserUsageData(USAGE_TOOL_NAME.SETTINGS.JOB_HISTORY.STATISTICS);
        }, 5000);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    const getStatsPages = (stats) => {
        const {
            totalRuntime,
            jobsFinished,
            jobsCancelled,
            averageTime,
            longestTime,
            jobsPerPort,
            runTimePerPort
        } = stats;

        return {
            [OVERALL_STATS]: {
                needsTable: false,
                html:
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
            },
            [JOB_PER_PORT]: {
                needsTable: true,
                columns: columnData.jobsPerPort,
                data: jobsPerPort,
            },
            [RUN_TIME_PER_PORT]: {
                needsTable: true,
                columns: columnData.runTimePerPort,
                data: runTimePerPort,
            }
        };
    };

    const selectRenderer = (option) => {
        const style = {
            color: '#333',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            textTransform: 'capitalize'
        };
        return (
            <div style={style} title={option.label}>{option.label}</div>
        );
    };

    return (
        <div className={styles.statsWrapper}>
            <div className={styles.addMargin}>
                <Select
                    id="statsSelect"
                    backspaceRemoves={false}
                    className="sm"
                    clearable={false}
                    menuContainerStyle={{ zIndex: 5 }}
                    name="Job Statistics"
                    onChange={(obj) => {
                        setPage(obj.value);
                    }}
                    options={map(STATS_PAGES, (value) => ({
                        value: value,
                        label: value
                    }))}
                    searchable={false}
                    value={{ label: page }}
                    valueRenderer={selectRenderer}
                />
            </div>
            <div className={styles.statsContent}>
                {
                    !isEmpty(statsPages) && (
                        statsPages[page].needsTable ? (
                            <SortableTable data={statsPages[page].data} columns={statsPages[page].columns} height="472px" />
                        ) : (
                            statsPages[page].html
                        )
                    )
                }
            </div>
        </div>
    );
};

export default StatsList;
