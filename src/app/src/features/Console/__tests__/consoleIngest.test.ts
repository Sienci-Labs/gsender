import {
    classifyControllerRead,
    classifyControllerWrite,
} from '../consoleIngest';

describe('classifyControllerRead', () => {
    it('treats plain controller output as a response', () => {
        expect(classifyControllerRead('ok')).toBe('response');
        expect(classifyControllerRead('<Idle|MPos:0.000,0.000,0.000>')).toBe(
            'response',
        );
        expect(classifyControllerRead('$130=800.000')).toBe('response');
    });

    it('flags alarms', () => {
        expect(
            classifyControllerRead(
                'ALARM:10 (EStop asserted. Clear and reset)',
            ),
        ).toBe('alarm');
    });

    it('flags errors', () => {
        expect(classifyControllerRead('error:20')).toBe('error');
    });

    it('treats controller messages as system output', () => {
        expect(
            classifyControllerRead(
                '[MSG:Emergency stop - clear, then reset to continue]',
            ),
        ).toBe('system');
    });

    it('promotes warning messages out of plain system output', () => {
        expect(classifyControllerRead('[MSG:WARN: Spindle at max]')).toBe(
            'warning',
        );
    });

    it('prefers the alarm classification when a message embeds one', () => {
        expect(classifyControllerRead('[MSG:ALARM:1 triggered]')).toBe('alarm');
    });
});

describe('classifyControllerWrite', () => {
    it('treats anything gSender puts on the wire as gcode', () => {
        expect(classifyControllerWrite('client')).toBe('gcode');
        expect(classifyControllerWrite('feeder')).toBe('gcode');
        expect(classifyControllerWrite('sender')).toBe('gcode');
        expect(classifyControllerWrite(undefined)).toBe('gcode');
    });

    it('separates messages the server writes about itself', () => {
        expect(classifyControllerWrite('server')).toBe('system');
    });
});
