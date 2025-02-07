import { createContext, useEffect, useState } from 'react';
import api from 'app/api';

type EventType = 'ALARM' | 'ERROR';

interface FirmwareEvent {
    id: string;
    type: EventType;
    source: string;
    time: string;
    CODE: string;
    MESSAGE: string;
    controller: string;
    line: string;
    lineNumber: number;
}

const initialState = {
    jobs: [],
    alarms: [],
    maintenanceTasks: [],
    jobAggregate: {},
};

export const StatContext = createContext(initialState);

export function StatsProvider({ children }) {
    const [jobs, setJobs] = useState([]);
    const [alarms, setAlarms] = useState<FirmwareEvent[]>([]);
    const [maintenanceTasks, setMaintenanceTasks] = useState([]);
    const [jobAggregate, setJobAggregate] = useState({});

    // File stats, Alarms and Maintenance
    useEffect(() => {
        const fetchJobStats = async () => {
            const jobStatRes = await api.jobStats.fetch();
            const { jobs, ...rest } = jobStatRes.data;
            setJobs(jobs);
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

    const payload = {
        jobs,
        jobAggregate,
        alarms,
        maintenanceTasks,
        setAlarms,
        setMaintenanceTasks,
    };

    return (
        <StatContext.Provider value={payload}>{children}</StatContext.Provider>
    );
}
