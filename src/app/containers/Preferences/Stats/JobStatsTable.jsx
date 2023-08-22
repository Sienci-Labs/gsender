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
import Icon from '@mdi/react';
import { mdiCheckBold, mdiClose } from '@mdi/js';
import styles from '../index.styl';
import jobActions from './lib/jobApiActions';
import { SortableTable, createTableColumns } from '../../../components/SortableTable/index';
import { GRBL, JOB_STATUS, JOB_TYPES } from '../../../constants';

const columnData = [
    {
        name: 'file',
        header: () => 'File Name',
    },
    {
        name: 'duration',
        header: () => 'Duration',
        cell: (info) => {
            const date = new Date(null);
            date.setMilliseconds(Number(info.renderValue()));
            return date.toISOString().slice(11, 19);
        },
        minSize: 55,
        maxSize: 55,
    },
    {
        name: 'totalLines',
        header: () => '# Lines',
        minSize: 50,
        maxSize: 50,
    },
    {
        name: 'startTime',
        header: () => 'Start Time',
        cell: (info) => {
            const [yyyy, mm, dd, hh, mi, ss] = info.renderValue().toString().split(/[:\-T.]+/);
            return (
                <>
                    <div>{hh}:{mi}:{ss} - {mm}/{dd}/{yyyy}</div>
                </>
            );
        },
        minSize: 90,
        maxSize: 90,
    },
    {
        name: 'jobStatus',
        header: () => 'Status',
        cell: (info) => {
            return info.renderValue() === JOB_STATUS.COMPLETE ? <Icon path={mdiCheckBold} size={1} /> : <Icon path={mdiClose} size={1} />;
        },
        minSize: 50,
        maxSize: 50,
    },
];

const defaultData = [
    {
        type: JOB_TYPES.JOB,
        file: '',
        path: null,
        lines: 0,
        port: '',
        controller: GRBL,
        startTime: new Date(),
        endTime: null,
        jobStatus: JOB_STATUS.COMPLETE
    },
];

const JobStatsTable = () => {
    const [data, setData] = useState([]);
    const [jobsFinished, setJobsFinished] = useState([]);
    const [jobsCancelled, setJobsCancelled] = useState([]);
    const columnHelpers = createTableColumns(columnData);

    useEffect(() => {
        jobActions.fetch(setData, setJobsFinished, setJobsCancelled);
    }, []);


    return (
        <div className={[styles.addMargin].join(' ')}>
            {
                jobsFinished === 0 && jobsCancelled === 0
                    ? <span>No jobs run</span>
                    : (
                        <SortableTable data={data} columns={columnHelpers} defaultData={defaultData} />
                    )
            }
        </div>
    );
};

export default JobStatsTable;
