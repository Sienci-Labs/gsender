import { http, HttpResponse } from 'msw';

// Endpoints of the gSender server that stories hit while rendering
export const mswHandlers = [
  // Keyboard shortcut binding (lib/combokeys.ts) loads macros to bind their shortcuts
  http.get('*/api/macros', () => HttpResponse.json({ records: [] })),
  // Wireless control (remote mode) status shown in StatusIcons
  http.get('*/api/remote', () =>
    HttpResponse.json({ ip: '192.168.0.42', port: 8000, headlessStatus: false }),
  ),
];
