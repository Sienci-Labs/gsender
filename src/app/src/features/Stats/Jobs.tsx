import SortableTable, { CustomColumnDef } from 'app/components/SortableTable';
import { StatCard } from 'app/features/Stats/components/StatCard.tsx';
import { useContext } from 'react';
import {
    Job,
    JOB_STATUS_T,
    StatContext,
} from 'app/features/Stats/utils/StatContext.tsx';
import { GRBL, JOB_STATUS, JOB_TYPES } from 'app/constants';
import Icon from '@mdi/react';
import { mdiCheckBold, mdiClose } from '@mdi/js';
import { CardHeader } from 'app/features/Stats/components/CardHeader.tsx';

import { convertMillisecondsToTimeStamp } from 'app/lib/datetime';
import { JobsPerComPort } from 'app/features/Stats/components/JobsPerComPort.tsx';
import { RunTimePerComPort } from 'app/features/Stats/components/RunTimePerComPort.tsx';

const defaultData: Job[] = [
    {
        type: JOB_TYPES.JOB,
        file: '',
        path: null,
        totalLines: 0,
        port: '',
        controller: GRBL,
        startTime: new Date(),
        endTime: null,
        jobStatus: JOB_STATUS.COMPLETE,
        duration: 0,
    },
];
const columnData: CustomColumnDef<Job, any>[] = [
    {
        accessorKey: 'file',
        header: () => 'File Name',
        cell: (info: { renderValue: () => string }) => {
            return (
                <>
                    <div className="break-all">{info.renderValue()}</div>
                </>
            );
        },
        size: 400,
    },
    {
        accessorKey: 'duration',
        header: () => 'Duration',
        cell: (info: { renderValue: () => number }) => {
            const ms = Number(info.renderValue());
            return convertMillisecondsToTimeStamp(ms);
        },
        size: 90,
    },
    {
        accessorKey: 'totalLines',
        header: () => '# Lines',
        size: 50,
    },
    {
        accessorKey: 'startTime',
        header: () => 'Start Time',
        cell: (info: { renderValue: () => Date }) => {
            const [yyyy, mm, dd, hh, mi, _ss] = info
                .renderValue()
                .toString()
                .split(/[:\-T.]+/);
            return (
                <>
                    <div>
                        {hh}:{mi} {dd}/{mm}/{yyyy}
                    </div>
                </>
            );
        },
        size: 100,
    },
    {
        accessorKey: 'jobStatus',
        header: () => 'Status',
        cell: (info: { renderValue: () => JOB_STATUS_T }) => {
            return info.renderValue() === JOB_STATUS.COMPLETE ? (
                <Icon path={mdiCheckBold} size={1} />
            ) : (
                <Icon path={mdiClose} size={1} />
            );
        },
        size: 20,
    },
];

export function Jobs() {
    const { jobs } = useContext(StatContext);
    return (
        <div className="grid grid-cols-6 grid-rows-6 gap-2 w-full h-full overflow-y-auto">
            <div className="col-span-4 row-span-6 px-8 max-xl:px-0 mb-2">
                <StatCard>
                    <CardHeader>Job History</CardHeader>
                    <div class="w-full flex flex-col">
                        <SortableTable
                            defaultData={defaultData}
                            data={jobs}
                            columns={columnData}
                            searchPlaceholder="Search past jobs..."
                            height="h-[calc(100vh-260px)]"
                        />
                    </div>
                </StatCard>
            </div>
            <div className="col-span-2 row-span-6 col-start-5 px-8 max-xl:px-0 flex flex-col gap-4 justify-center items-center">
                <div className="flex flex-col bg-white border border-gray-300 rounded p-2 h-full dark:bg-dark dark:border-dark-lighter w-full justify-center items-center">
                    <CardHeader>Jobs per CNC</CardHeader>
                    <JobsPerComPort />
                </div>
                <div className="flex flex-col bg-white border border-gray-300 rounded p-2 h-full dark:bg-dark dark:border-dark-lighter w-full justify-center items-center">
                    <CardHeader>Run Time per CNC</CardHeader>
                    <RunTimePerComPort />
                </div>
            </div>
        </div>
    );
}
