import { http, HttpResponse } from 'msw';

// Endpoints of the gSender server that stories hit while rendering
export const mswHandlers = [
    // Keyboard shortcut binding (lib/combokeys.ts) loads macros to bind their shortcuts
    http.get('*/api/macros', () => HttpResponse.json({ records: [] })),
    // Job history; FileControl shows the most recent job when no file is loaded
    http.get('*/api/jobstats', () => HttpResponse.json({ jobs: [] })),
    // Stats page: alarm/error history and maintenance tasks
    http.get('*/api/alarmList', () => HttpResponse.json({ list: [] })),
    http.get('*/api/maintenance', () => HttpResponse.json([])),
    // Event hooks (G-code run on job start/stop etc.) edited in Config
    http.get('*/api/events', () => HttpResponse.json({ records: {} })),
    // Release history shown on Stats > About
    http.get('*/api/releasenotes', () => HttpResponse.json([])),
    // Wireless control (remote mode) status shown in StatusIcons
    http.get('*/api/remote', () =>
        HttpResponse.json({
            ip: '192.168.0.42',
            port: 8000,
            headlessStatus: false,
        }),
    ),
];
