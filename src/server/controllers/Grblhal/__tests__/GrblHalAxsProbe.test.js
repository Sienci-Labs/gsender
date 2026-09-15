// NOTE: require(), not import. jest.config.js maps 'config/settings' to the app's
// mock, which has no winston key, so the server logger would throw on
// settings.winston.level while building the module graph. Setting the log level
// short-circuits that read - and it has to happen before the controller is
// loaded, which rules out hoisted ESM imports.
process.env.GSENDER_LOG_LEVEL = process.env.GSENDER_LOG_LEVEL || 'error';

const events = require('events');
const GrblHalController = require('../GrblHalController').default;

// Regression cover for the runaway `$I` poll: the controller re-sent `$I`
// whenever no [AXS:] had been parsed, but the retry counter lived in actionMask,
// which clearActionValues() wipes on every startup/[VER:] message - including the
// [VER:] in the reply to the controller's own probing `$I`. The counter was reset
// by the very response it was counting, so `$I` went out with every status report
// (~4/sec) forever on firmware that never reports [AXS:].

class FakeConnection extends events.EventEmitter {
    constructor() {
        super();
        this.writes = [];
    }

    setWriteFilter(filter) {
        this.filter = filter;
    }

    write(data) {
        this.writes.push(Buffer.isBuffer(data) ? '<binary>' : String(data));
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

const IDLE_STATUS = '<Idle|MPos:1.000,2.000,3.000|FS:0,0>';

const makeController = () => {
    const connection = new FakeConnection();
    const controller = new GrblHalController(
        { event: { on() {}, trigger() {} } },
        connection,
        { port: '/dev/fake', baudrate: 115200 }
    );
    controller.ready = true;
    controller.emit = () => {}; // don't broadcast to sockets
    controller.resetAxsProbe();
    return { controller, connection };
};

const countI = (connection) =>
    connection.writes.filter((write) => write.trim() === '$I').length;

// Feed the reply block a real grblHAL board sends for `$I`, terminated by ok.
const replyToI = (controller, axsLine) => {
    controller.runner.parse('[VER:1.1f.20230131:]');
    controller.runner.parse('[OPT:VNMSL,35,1024,3,0]');
    if (axsLine) {
        controller.runner.parse(axsLine);
    }
    controller.runner.parse('ok');
};

// Let the retry interval elapse without waiting on real time.
const elapseRetryInterval = (controller) => {
    controller.axsQueryLastTime -= 60000;
};

describe('GrblHalController [AXS:] probing', () => {
    let controller;
    let connection;

    afterEach(() => {
        controller.destroy();
    });

    describe('firmware that never reports [AXS:]', () => {
        beforeEach(() => {
            ({ controller, connection } = makeController());
        });

        it('stops sending $I instead of polling forever', () => {
            for (let tick = 0; tick < 300; tick++) {
                elapseRetryInterval(controller);
                controller.runner.parse(IDLE_STATUS);
                replyToI(controller);
            }

            // Pre-fix this was 300 - one $I per status report.
            expect(countI(connection)).toBe(2);
        });

        it('does not let clearActionValues() refill the retry budget', () => {
            controller.runner.parse(IDLE_STATUS);
            expect(countI(connection)).toBe(1);

            // The [VER:] in this reply triggers clearActionValues().
            replyToI(controller);
            elapseRetryInterval(controller);
            controller.runner.parse(IDLE_STATUS);
            expect(countI(connection)).toBe(2);

            // Budget is now spent and must stay spent.
            replyToI(controller);
            elapseRetryInterval(controller);
            controller.runner.parse(IDLE_STATUS);
            expect(countI(connection)).toBe(2);
        });

        it('sends only one $I while a probe is still in flight', () => {
            controller.runner.parse(IDLE_STATUS);
            for (let tick = 0; tick < 50; tick++) {
                elapseRetryInterval(controller);
                controller.runner.parse(IDLE_STATUS);
            }

            expect(countI(connection)).toBe(1);
        });

        it('waits for a completed $I reply before inferring axes', () => {
            // Probe 1 in flight: nothing known yet, so nothing may be inferred.
            controller.runner.parse(IDLE_STATUS);
            expect(controller.runner.hasAXS()).toBe(false);

            // Probe 1 answered without [AXS:], but retries remain - still no guess.
            replyToI(controller);
            expect(controller.runner.hasAXS()).toBe(false);

            // Probe 2 answered without [AXS:]: only now is absence established.
            elapseRetryInterval(controller);
            controller.runner.parse(IDLE_STATUS);
            expect(controller.runner.hasAXS()).toBe(false);
            replyToI(controller);

            expect(controller.runner.state.axes).toEqual({
                count: 3,
                axes: ['X', 'Y', 'Z'],
                inferred: true
            });
        });

        it('infers a 4th axis when the status report has one', () => {
            for (let probe = 0; probe < 2; probe++) {
                elapseRetryInterval(controller);
                controller.runner.parse('<Idle|MPos:1.000,2.000,3.000,4.000|FS:0,0>');
                replyToI(controller);
            }

            expect(controller.runner.state.axes).toEqual({
                count: 4,
                axes: ['X', 'Y', 'Z', 'A'],
                inferred: true
            });
        });

        it('lets a later real [AXS:] override the inferred axes', () => {
            for (let probe = 0; probe < 2; probe++) {
                elapseRetryInterval(controller);
                controller.runner.parse('<Idle|MPos:1.000,2.000,3.000,4.000|FS:0,0>');
                replyToI(controller);
            }
            expect(controller.runner.state.axes.inferred).toBe(true);

            // Firmware letters are authoritative - they must win, and the
            // inferred marker must go away with them. This is what keeps the
            // fallback safe for future arbitrary-axis firmware.
            controller.runner.parse('[AXS:4:XYZC]');

            expect(controller.runner.state.axes).toEqual({
                count: 4,
                axes: ['X', 'Y', 'Z', 'C']
            });
        });

        it('never probes while the machine is not idle', () => {
            for (let tick = 0; tick < 50; tick++) {
                elapseRetryInterval(controller);
                controller.runner.parse('<Run|MPos:1.000,2.000,3.000|FS:500,0>');
            }

            expect(countI(connection)).toBe(0);
        });
    });

    describe('firmware that reports [AXS:]', () => {
        beforeEach(() => {
            ({ controller, connection } = makeController());
        });

        it('probes once, then never again', () => {
            controller.runner.parse(IDLE_STATUS);
            replyToI(controller, '[AXS:4:XYZC]');

            for (let tick = 0; tick < 300; tick++) {
                elapseRetryInterval(controller);
                controller.runner.parse(IDLE_STATUS);
            }

            expect(countI(connection)).toBe(1);
        });

        it('keeps the firmware axes and never marks them inferred', () => {
            controller.runner.parse(IDLE_STATUS);
            replyToI(controller, '[AXS:4:XYZC]');

            expect(controller.runner.state.axes).toEqual({
                count: 4,
                axes: ['X', 'Y', 'Z', 'C']
            });
        });
    });

    describe('probe whose terminating ok never arrives', () => {
        beforeEach(() => {
            ({ controller, connection } = makeController());
        });

        it('still resolves, so the axes are populated', () => {
            controller.runner.parse(IDLE_STATUS);
            expect(controller.axsProbePending).toBe(true);

            controller.axsQueryCount = 2; // budget already spent
            controller.resolveAxsProbe(); // what the safety-net timer calls

            expect(controller.axsProbePending).toBe(false);
            expect(controller.runner.state.axes).toEqual({
                count: 3,
                axes: ['X', 'Y', 'Z'],
                inferred: true
            });
        });
    });
});
