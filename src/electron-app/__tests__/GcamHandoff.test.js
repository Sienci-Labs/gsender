/**
 * @jest-environment node
 */
import { createGcamHandoffServer, sanitizeProgramName } from '../GcamHandoff';

const ORIGIN = 'http://localhost:5174';
const silentLogger = { info: () => {}, warn: () => {}, error: () => {} };

describe('GcamHandoff', () => {
    let handoff;
    let baseUrl;
    let state;
    let received;

    beforeEach(async () => {
        state = { enabled: true, busy: false };
        received = [];
        handoff = createGcamHandoffServer({
            port: 0,
            version: '1.2.3',
            logger: silentLogger,
            maxBytes: 1024,
            isEnabled: () => state.enabled,
            isBusy: () => state.busy,
            onFile: (file) => {
                received.push(file);
            },
        });
        const port = await handoff.start();
        baseUrl = `http://127.0.0.1:${port}`;
    });

    afterEach(() => handoff.stop());

    const load = (body, headers = {}) =>
        fetch(`${baseUrl}/gcam/v1/load`, {
            method: 'POST',
            headers: {
                Origin: ORIGIN,
                'Content-Type': 'application/json',
                ...headers,
            },
            body: typeof body === 'string' ? body : JSON.stringify(body),
        });

    it('reports status on ping', async () => {
        const res = await fetch(`${baseUrl}/gcam/v1/ping`, {
            headers: { Origin: ORIGIN },
        });
        expect(res.status).toBe(200);
        expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
        expect(await res.json()).toMatchObject({
            app: 'gSender',
            version: '1.2.3',
            accepting: true,
        });
    });

    it('answers private network preflights', async () => {
        const res = await fetch(`${baseUrl}/gcam/v1/load`, {
            method: 'OPTIONS',
            headers: {
                Origin: ORIGIN,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Private-Network': 'true',
            },
        });
        expect(res.status).toBe(204);
        expect(res.headers.get('access-control-allow-private-network')).toBe(
            'true',
        );
    });

    it('allows the hosted gCAM origin', async () => {
        const hosted = 'https://petervanderwalt.github.io';
        const res = await fetch(`${baseUrl}/gcam/v1/load`, {
            method: 'OPTIONS',
            headers: {
                Origin: hosted,
                'Access-Control-Request-Method': 'POST',
            },
        });
        expect(res.status).toBe(204);
        expect(res.headers.get('access-control-allow-origin')).toBe(hosted);
    });

    it('allows the gCAM desktop origin', async () => {
        const desktop = 'gcam://app';
        const res = await load(
            { name: 'part.nc', gcode: 'G0 X0' },
            { Origin: desktop },
        );
        expect(res.status).toBe(202);
        expect(res.headers.get('access-control-allow-origin')).toBe(desktop);
        expect(received).toHaveLength(1);
    });

    it('accepts programs from local clients without an Origin', async () => {
        const res = await fetch(`${baseUrl}/gcam/v1/load`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'part.nc', gcode: 'G0 X0' }),
        });
        expect(res.status).toBe(202);
        expect(received).toEqual([{ name: 'part.nc', gcode: 'G0 X0' }]);
    });

    it('accepts a program and sanitizes its name', async () => {
        const res = await load({ name: '../part', gcode: 'G0 X0' });
        expect(res.status).toBe(202);
        expect(received).toEqual([{ name: '_part.nc', gcode: 'G0 X0' }]);
    });

    it('rejects origins outside the allowlist', async () => {
        const res = await load(
            { name: 'a.nc', gcode: 'G0' },
            { Origin: 'https://evil.example' },
        );
        expect(res.status).toBe(403);
        expect(received).toHaveLength(0);
    });

    it('refuses files while a job is running', async () => {
        state.busy = true;
        const res = await load({ name: 'a.nc', gcode: 'G0' });
        expect(res.status).toBe(409);
        expect(received).toHaveLength(0);
    });

    it('refuses files when disabled', async () => {
        state.enabled = false;
        expect((await load({ name: 'a.nc', gcode: 'G0' })).status).toBe(503);
    });

    it('validates the body', async () => {
        expect((await load('not json')).status).toBe(400);
        expect((await load({ name: 'a.nc', gcode: '  ' })).status).toBe(400);
        expect(
            (await load({ gcode: 'G0' }, { 'Content-Type': 'text/plain' }))
                .status,
        ).toBe(415);
    });

    it('rejects oversized programs', async () => {
        const res = await load({ name: 'a.nc', gcode: 'G0 '.repeat(1000) });
        expect(res.status).toBe(413);
    });
});

describe('sanitizeProgramName', () => {
    it.each([
        ['part.nc', 'part.nc'],
        ['part.gcode', 'part.gcode'],
        ['part', 'part.nc'],
        ['', 'gcam.nc'],
        ['a:b*c', 'a_b_c.nc'],
        ['..hidden', 'hidden.nc'],
    ])('%s -> %s', (input, expected) => {
        expect(sanitizeProgramName(input)).toBe(expected);
    });
});
