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
import styles from '../../index.styl';
import JobTable from './JobTable';
import jobActions from './jobApiActions';
import Fieldset from '../../components/Fieldset';

const StatsTable = ({ state, actions }) => {
    const [data, setData] = useState([]);
    const [jobsFinished, setJobsFinished] = useState([]);
    const [jobsCancelled, setJobsCancelled] = useState([]);

    useEffect(() => {
        console.log('api call');
        jobActions.fetch(setData, setJobsFinished, setJobsCancelled);
    }, []);


    return (
        <Fieldset legend="Table" >
            <div className={[styles.addMargin].join(' ')}>
                {
                    jobsFinished === 0 && jobsCancelled === 0
                        ? <span>No jobs run</span>
                        : (
                            <JobTable props={data} />
                        )
                }
            </div>
        </Fieldset>
    );
};

export default StatsTable;
