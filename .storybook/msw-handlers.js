import { http, HttpResponse } from 'msw';

// Endpoints of the gSender server that stories hit while rendering
export const mswHandlers = [
  // Keyboard shortcut binding (lib/combokeys.ts) loads macros to bind their shortcuts
  http.get('*/api/macros', () => HttpResponse.json({ records: [] })),
];
