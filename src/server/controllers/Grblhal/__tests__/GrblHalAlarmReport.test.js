// See GrblHalAxsProbe.test.js for why this is require() with the log level set first.
process.env.GSENDER_LOG_LEVEL = process.env.GSENDER_LOG_LEVEL || 'error';

const events = require('events');
const GrblHalController = require('../GrblHalController').default;

// While in Alarm with no known code, the status poll swaps '?' for 0x87 (complete
// report) to learn the code. Firmware that never includes the code used to get
// 0x87 on every poll (~4/sec) for as long as the alarm lasted.

class FakeConnection extends events.EventEmitter {
    constructor() {
        super();
        this.writes = [];
    }

    setWriteFilter(filter) {
        this.filter = filter;
    }

    write(data) {
        this.writes.push(Buffer.isBuffer(data) ? `<0x${data.toString('hex')}>` : String(data));
    }

    writeImmediate(data) {
        this.write(data);
    }

    isOpen() {
        return true;
    }

    isClose() {
        return false;
    }
}

const ALARM_NO_CODE = '<Alarm|MPos:0.000,0.000,0.000|FS:0,0>';
// A plain '?' reply carries the substate, but only a complete (0x87) report -
// identified by its FW: field - sets runner.state.status.alarmCode.
const ALARM_PLAIN = '<Alarm:11|MPos:0.000,0.000,0.000|FS:0,0>';
const ALARM_COMPLETE = '<Alarm:11|MPos:0.000,0.000,0.000|FS:0,0|FW:grblHAL>';
const IDLE = '<Idle|MPos:0.000,0.000,0.000|FS:0,0>';

const count87 = (connection) =>
    connection.writes.filter((w) => w === '<0x87>' || w === '\x87').length;
const countQuery = (connection) =>
    connection.writes.filter((w) => w === '?').length;

describe('GrblHalController alarm complete-report polling', () => {
    let controller;
    let connection;

    beforeEach(() => {
        jest.useFakeTimers();
        connection = new FakeConnection();
        controller = new GrblHalController(
            { event: { on() {}, trigger() {} } },
            connection,
            { port: '/dev/fake', baudrate: 115200 },
        );
        controller.ready = true;
        controller.emit = () => {};
        controller.resetAxsProbe();
    });

    afterEach(() => {
        controller.destroy();
        jest.useRealTimers();
    });

    // One poll tick, answered with the given status line.
    const poll = (status) => {
        jest.advanceTimersByTime(250);
        controller.runner.parse(status);
    };

    it('caps 0x87 when the firmware never reports an alarm code', () => {
        controller.runner.parse(ALARM_NO_CODE);
        for (let i = 0; i < 20; i++) {
            poll(ALARM_NO_CODE);
        }

        expect(count87(connection)).toBe(3);
        expect(countQuery(connection)).toBeGreaterThan(10);
    });

    it('stops sending 0x87 once the code arrives', () => {
        controller.runner.parse(ALARM_NO_CODE);
        poll(ALARM_COMPLETE); // reply to our 0x87
        const after = count87(connection);
        for (let i = 0; i < 10; i++) {
            poll(ALARM_PLAIN);
        }

        expect(after).toBe(1);
        expect(count87(connection)).toBe(1);
    });

    it('never sends 0x87 when the connect report already has the code', () => {
        controller.runner.parse(ALARM_COMPLETE); // reply to open()'s 0x87
        for (let i = 0; i < 10; i++) {
            poll(ALARM_PLAIN);
        }

        expect(count87(connection)).toBe(0);
    });

    it('gives a new alarm a fresh budget after leaving alarm', () => {
        controller.runner.parse(ALARM_NO_CODE);
        for (let i = 0; i < 10; i++) {
            poll(ALARM_NO_CODE);
        }
        poll(IDLE);
        poll(ALARM_NO_CODE);
        for (let i = 0; i < 10; i++) {
            poll(ALARM_NO_CODE);
        }

        expect(count87(connection)).toBe(6);
    });

    it('realtime_report sends a bare 0x87 with no trailing newline', () => {
        controller.command('realtime_report');
        expect(connection.writes).toContain('\x87');
        expect(connection.writes).not.toContain('\x87\n');
    });
});
