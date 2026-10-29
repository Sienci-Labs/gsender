// Shared data for the Stats stories, shaped like the gSender server's responses
import { http, HttpResponse } from 'msw';

const HOUR = 60 * 60 * 1000;
const hoursAgo = (hours) => new Date(Date.now() - hours * HOUR).toISOString();

// The server returns jobs oldest first; StatsProvider reverses them
export const JOBS = [
    {
        id: '1',
        file: 'coaster-set.nc',
        port: 'COM4',
        jobStatus: 'COMPLETE',
        duration: 0.5 * HOUR,
        totalLines: 8000,
        startTime: hoursAgo(72),
    },
    {
        id: '2',
        file: 'sign-carving.nc',
        port: 'COM4',
        jobStatus: 'STOPPED',
        duration: 0.25 * HOUR,
        totalLines: 40000,
        startTime: hoursAgo(30),
    },
    {
        id: '3',
        file: 'cutting-board.nc',
        port: 'COM4',
        jobStatus: 'COMPLETE',
        duration: 1.5 * HOUR,
        totalLines: 22000,
        startTime: hoursAgo(5),
    },
    {
        id: '4',
        file: 'other-machine.nc',
        port: 'COM7',
        jobStatus: 'COMPLETE',
        duration: 2 * HOUR,
        totalLines: 5000,
        startTime: hoursAgo(2),
    },
];

export const ALARMS = [
    {
        id: 'a1',
        type: 'ALARM',
        CODE: '1',
        MESSAGE: 'Hard limit triggered',
        source: 'Feeder',
        time: hoursAgo(3),
        controller: 'grblHAL',
        line: '',
        lineNumber: 0,
    },
    {
        id: 'a2',
        type: 'ERROR',
        CODE: '9',
        MESSAGE: 'G-code locked out during alarm',
        source: 'Console',
        time: hoursAgo(1),
        controller: 'grblHAL',
        line: 'G0 X10',
        lineNumber: 1,
    },
];

// Hours of machine time: overdue, inside the window, and far off
export const TASKS = [
    {
        id: 1,
        name: 'Lubricate rails',
        description: '',
        rangeStart: 20,
        rangeEnd: 30,
        currentTime: 42,
    },
    {
        id: 2,
        name: 'Check belt tension',
        description: '',
        rangeStart: 40,
        rangeEnd: 50,
        currentTime: 45,
    },
    {
        id: 3,
        name: 'Replace spindle brushes',
        description: '',
        rangeStart: 500,
        rangeEnd: 600,
        currentTime: 45,
    },
];

// Story beforeEach that serves the data StatsProvider loads on mount
export const statsApi =
    ({ jobs = [], alarms = [], tasks = [] }) =>
    ({ msw }) => {
        msw.use(
            http.get('*/api/jobstats', () =>
                HttpResponse.json({ jobs: structuredClone(jobs) }),
            ),
            http.get('*/api/alarmList', () =>
                HttpResponse.json({ list: alarms }),
            ),
            http.get('*/api/maintenance', () => HttpResponse.json(tasks)),
        );
    };
