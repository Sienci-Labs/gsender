import { createContext, ReactNode, useEffect, useState } from 'react';
import api from 'app/api';
import { FIRMWARE_TYPES_T } from 'app/definitions/firmware';
import { JOB_STATUS, JOB_TYPES } from 'app/constants';
import { AxiosResponse } from 'axios';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import {
    calculateJobStats,
    filterJobsByPort,
} from 'app/features/Stats/utils/statUtils.ts';

type EventType = 'ALARM' | 'ERROR';
export type JOB_TYPES_T = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];
export type JOB_STATUS_T = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export interface FirmwareEvent {
    id: string;
    type: EventType;
    source: string;
    time: string;
    CODE: string;
    MESSAGE: string;
    controller: string;
    line: string;
    lineNumber: number;
    subRow?: string;
}

export interface Job {
    id?: string;
    type: JOB_TYPES_T;
    file: string;
    path: string | null;
    port: string;
    controller: FIRMWARE_TYPES_T;
    startTime: Date;
    endTime: Date | null;
    duration: number;
    jobStatus: JOB_STATUS_T;
    totalLines: number;
    subRow?: string;
}

export interface JobStats {
    completeJobs: number;
    incompleteJobs: number;
    totalCutTime: number;
    averageCutTime: number;
    longestCutTime: number;
}

export interface MaintenanceTask {
    id?: number;
    description: string;
    rangeStart: number;
    rangeEnd: number;
    name: string;
    currentTime: number;
    subRow?: string;
}

export interface JobAggregate {
    [key: string]: number;
}

const initialState: {
    jobs: Job[];
    alarms: FirmwareEvent[];
    isConnected: false;
    maintenanceTasks: MaintenanceTask[];
    jobAggregate: JobAggregate;
    maintenanceActions?: {
        update: (
            newTasks: MaintenanceTask[],
        ) => Promise<AxiosResponse<any, any>>;
    };
    setAlarms?: React.Dispatch<React.SetStateAction<FirmwareEvent[]>>;
    setMaintenanceTasks?: React.Dispatch<React.SetStateAction<any[]>>;
} = {
    jobs: [],
    alarms: [],
    maintenanceTasks: [],
    jobAggregate: {},
    isConnected: false,
};

export const StatContext = createContext(initialState);

export function StatsProvider({ children }: { children: ReactNode }) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [alarms, setAlarms] = useState<FirmwareEvent[]>([]);
    const [maintenanceTasks, setMaintenanceTasks] = useState([]);
    const [jobAggregate, setJobAggregate] = useState({});
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

    const [jobStats, setJobStats] = useState<JobStats>({
        averageCutTime: 0,
        completeJobs: 0,
        incompleteJobs: 0,
        longestCutTime: 0,
        totalCutTime: 0,
    });

    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const connectedPort = useTypedSelector(
        (state: RootState) => state.connection.port,
    );

    // File stats, Alarms and Maintenance
    useEffect(() => {
        const fetchJobStats = async () => {
            const jobStatRes = await api.jobStats.fetch();
            const { jobs = [], ...rest } = jobStatRes.data;
            setJobs(jobs.reverse());
            setJobAggregate(rest);
        };

        const fetchAlarms = async () => {
            const alarmRes = await api.alarmList.fetch();
            const { list } = alarmRes.data;
            setAlarms(list);
        };

        const fetchMaintenance = async () => {
            const maintenanceRes = await api.maintenance.fetch();
            setMaintenanceTasks(maintenanceRes.data);
        };

        fetchJobStats().catch((e) => console.error(e));
        fetchAlarms().catch((e) => console.error(e));
        fetchMaintenance().catch((e) => console.error(e));
    }, []);

    useEffect(() => {
        if (!isConnected) return;
        if (!connectedPort || connectedPort.length === 0) return;

        const jobsOnConnectedPort = filterJobsByPort(jobs, connectedPort);
        const portStats = calculateJobStats(jobsOnConnectedPort);

        setJobStats(portStats);
        setFilteredJobs(jobsOnConnectedPort);
    }, [jobs, isConnected, connectedPort]);

    const maintenanceActions = {
        update: async (newTasks: MaintenanceTask[]) => {
            try {
                let res = await api.maintenance.update(newTasks);
                return res;
            } catch (error) {
                console.log(error);
            }
            return null;
        },
    };

    const payload = {
        jobs,
        jobAggregate,
        alarms,
        maintenanceTasks,
        maintenanceActions,
        isConnected,
        setAlarms,
        setMaintenanceTasks,
        jobStats,
        filteredJobs,
    };

    return (
        <StatContext.Provider value={payload}>{children}</StatContext.Provider>
    );
}
