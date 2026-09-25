import { GRBL, GRBLHAL } from 'app/constants';
import {
    formatHelperDetails,
    getEyebrow,
    NO_DESCRIPTION,
    normalizeHelperMessage,
} from 'app/features/Helper/messages/normalize';
import { HELPER_REGISTRY } from 'app/features/Helper/messages/registry';
import { createElement } from 'react';

const normalize = (
    payload: Parameters<typeof normalizeHelperMessage>[0],
    context?: Parameters<typeof normalizeHelperMessage>[1],
) => {
    const message = normalizeHelperMessage(payload, context);
    if (!message) {
        throw new Error('expected a message');
    }
    return message;
};

describe('normalizeHelperMessage defaults', () => {
    it.each([
        ['alarm', 'full'],
        ['error', 'full'],
        ['info', 'full'],
        ['reminder', 'compact'],
        ['maintenance', 'compact'],
        ['tip', 'minimal'],
    ] as const)('%s defaults to %s weight', (kind, weight) => {
        expect(normalize({ kind, title: 't', description: 'd' }).weight).toBe(
            weight,
        );
    });

    it('keeps an explicit weight', () => {
        expect(
            normalize({ kind: 'reminder', weight: 'minimal', title: 't', description: 'd' })
                .weight,
        ).toBe('minimal');
    });

    it('turns on link and QR for a resource unless told otherwise', () => {
        const message = normalize({
            title: 't',
            description: 'd',
            resource: { label: 'Guide', url: 'https://example.com', qr: false },
        });
        expect(message.resource).toEqual({
            label: 'Guide',
            url: 'https://example.com',
            link: true,
            qr: false,
        });
    });

    it('drops a resource with neither link nor QR', () => {
        const message = normalize({
            title: 't',
            description: 'd',
            resource: { label: 'Guide', url: 'u', link: false, qr: false },
        });
        expect(message.resource).toBeUndefined();
    });
});

describe('legacy payloads', () => {
    it('treats { title, description, content } as a full info message', () => {
        const content = createElement('span', null, 'slot');
        const message = normalize({ title: 'Old', description: 'Text', content });
        expect(message).toMatchObject({
            kind: 'info',
            weight: 'full',
            title: 'Old',
            description: 'Text',
            content,
        });
        expect(message.resource).toBeUndefined();
    });

    it('maps qrCode to a link + QR resource', () => {
        const message = normalize({ title: 't', description: 'd', qrCode: 'https://q' });
        expect(message.resource).toMatchObject({ url: 'https://q', link: true, qr: true });
        expect(message).not.toHaveProperty('qrCode');
    });

    it('maps resourceLink to a link-only resource', () => {
        const message = normalize({ title: 't', description: 'd', resourceLink: 'https://r' });
        expect(message.resource).toMatchObject({ url: 'https://r', link: true, qr: false });
    });
});

describe('alarm and error text lookup', () => {
    it('fills grbl alarm text from the constants', () => {
        const message = normalize({ kind: 'alarm', code: 9 }, { controllerType: GRBL });
        expect(message.title).toBe('Homing fail');
        expect(message.description).toMatch(/Could not find limit switch/);
    });

    it("handles grbl's 'Homing' alarm code", () => {
        const message = normalize({ kind: 'alarm', code: 'Homing' }, { controllerType: GRBL });
        expect(message.title).toBe('Homing required');
    });

    it('fills error text from the error list', () => {
        const message = normalize({ kind: 'error', code: 22 }, { controllerType: GRBL });
        expect(message.title).toBe('Undefined feed rate');
    });

    it('uses grblHAL alarms, not grbl ones, on grblHAL', () => {
        const message = normalize({ kind: 'alarm', code: 10 }, { controllerType: GRBLHAL });
        expect(message.title).toBe('EStop');
    });

    it("prefers the grblHAL controller's own alarm description", () => {
        const message = normalize(
            { kind: 'alarm', code: 10 },
            {
                controllerType: GRBLHAL,
                controllerAlarms: { 10: { description: 'From firmware' } },
            },
        );
        expect(message.title).toBe('EStop');
        expect(message.description).toBe('From firmware');
    });

    it('falls back when the code is unknown', () => {
        const message = normalize({ kind: 'alarm', code: 999 }, { controllerType: GRBL });
        expect(message.title).toBe('Alarm 999');
        expect(message.description).toBe(NO_DESCRIPTION);
    });

    it('lets explicit payload fields win over controller text', () => {
        const message = normalize(
            { kind: 'error', code: 22, title: 'Invalid line', description: 'custom' },
            { controllerType: GRBL },
        );
        expect(message.title).toBe('Invalid line');
        expect(message.description).toBe('custom');
    });
});

describe('registry merge', () => {
    afterEach(() => {
        Object.keys(HELPER_REGISTRY).forEach((key) => {
            delete HELPER_REGISTRY[key];
        });
    });

    it('overrides controller fields one at a time', () => {
        HELPER_REGISTRY['alarm:9'] = {
            steps: ['Check wiring'],
            resource: { label: 'Homing', url: 'https://h' },
        };
        const message = normalize({ kind: 'alarm', code: 9 }, { controllerType: GRBL });
        expect(message.title).toBe('Homing fail');
        expect(message.steps).toEqual(['Check wiring']);
        expect(message.resource).toMatchObject({ url: 'https://h', link: true, qr: true });
    });

    it('checks the controller-specific key first', () => {
        HELPER_REGISTRY['alarm:9'] = { title: 'Generic' };
        HELPER_REGISTRY['grblhal:alarm:9'] = { title: 'grblHAL specific' };
        expect(
            normalize({ kind: 'alarm', code: 9 }, { controllerType: GRBLHAL }).title,
        ).toBe('grblHAL specific');
        expect(normalize({ kind: 'alarm', code: 9 }, { controllerType: GRBL }).title).toBe(
            'Generic',
        );
    });
});

describe('dismissed messages', () => {
    it('returns null for a dismissed key', () => {
        const isDismissed = (key: string) => key === 'tips.reprobe';
        expect(
            normalizeHelperMessage(
                { kind: 'tip', title: 't', description: 'd', dismissKey: 'tips.reprobe' },
                { isDismissed },
            ),
        ).toBeNull();
        expect(
            normalizeHelperMessage(
                { kind: 'tip', title: 't', description: 'd', dismissKey: 'other' },
                { isDismissed },
            ),
        ).not.toBeNull();
    });
});

describe('display helpers', () => {
    it('builds the eyebrow from kind and code', () => {
        expect(getEyebrow(normalize({ kind: 'alarm', code: 9 }))).toBe('Alarm 9');
        expect(getEyebrow(normalize({ kind: 'error', title: 't', description: 'd' }))).toBe(
            'Error',
        );
        expect(
            getEyebrow(normalize({ kind: 'info', eyebrow: 'Custom', title: 't', description: 'd' })),
        ).toBe('Custom');
    });

    it('formats copy details with raw code, plain-text description and context', () => {
        const message = normalize({
            kind: 'alarm',
            code: 9,
            raw: 'ALARM:9',
            title: 'Homing fail',
            description: createElement(
                'div',
                null,
                createElement('p', null, 'First line.'),
                createElement('p', null, 'Second ', createElement('b', null, 'bold'), '.'),
            ),
        });
        const text = formatHelperDetails(
            message,
            GRBL,
            new Date('2026-09-25T12:00:00.000Z'),
        );
        expect(text).toBe(
            [
                'ALARM:9 — Homing fail',
                'First line. Second bold.',
                'Controller: Grbl   Time: 2026-09-25T12:00:00.000Z',
            ].join('\n'),
        );
    });

    it('uses the eyebrow when there is no raw code', () => {
        const message = normalize({ kind: 'error', title: 'Invalid lines detected', description: 'x' });
        expect(formatHelperDetails(message, GRBL).split('\n')[0]).toBe(
            'ERROR — Invalid lines detected',
        );
    });
});
