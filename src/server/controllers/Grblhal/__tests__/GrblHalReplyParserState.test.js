// See the note in GrblHalAxsProbe.test.js for why this uses require().
process.env.GSENDER_LOG_LEVEL = process.env.GSENDER_LOG_LEVEL || 'error';

const events = require('events');
const GrblHalController = require('../GrblHalController').default;
const {
    GRBLHAL_REALTIME_COMMANDS
} = require('../constants');

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

const makeController = () => {
    const connection = new FakeConnection();
    const controller = new GrblHalController(
        { event: { on() {}, trigger() {} } },
        connection,
        { port: '/dev/fake', baudrate: 115200 }
    );
    controller.ready = true;
    controller.resetAxsProbe();
    return controller;
};

describe('GrblHalController reply echo flags', () => {
    let controller;
    let reads;

    beforeEach(() => {
        controller = makeController();
        reads = [];
        // Capture what would be echoed back to the console.
        controller.emit = (event, ...args) => {
            if (event === 'serialport:read') {
                reads.push(args[0]);
            }
        };
    });

    afterEach(() => {
        controller.destroy();
    });

    it('GCODE_REPORT carries the newline that made the old comparison dead', () => {
        // Guards the root cause: write() trims the command before comparing, so
        // comparing against the raw constant could never match.
        expect(GRBLHAL_REALTIME_COMMANDS.GCODE_REPORT).toBe('$G\n');
        expect(GRBLHAL_REALTIME_COMMANDS.GCODE_REPORT.trim()).toBe('$G');
    });

    it('flags a user-typed $G for echo', () => {
        expect(controller.actionMask.replyParserState).toBe(false);

        controller.writeln('$G');

        expect(controller.actionMask.replyParserState).toBe(true);
    });

    it('echoes the parser state and the ok back for a user-typed $G', () => {
        controller.writeln('$G');

        controller.runner.parse('[GC:G0 G54 G17 G21 G90 G94 M5 M9 T0 F0 S0]');
        expect(reads).toContain('[GC:G0 G54 G17 G21 G90 G94 M5 M9 T0 F0 S0]');

        controller.runner.parse('ok');
        expect(reads).toContain('ok');

        // Flag is one-shot: it must not keep echoing automatic $G queries.
        expect(controller.actionMask.replyParserState).toBe(false);
    });

    it('does not echo the automatic $G query from the poll loop', () => {
        // The poll loop writes straight to the connection, bypassing write(),
        // precisely so it does not set the echo flag.
        controller.connection.writeImmediate(
            GRBLHAL_REALTIME_COMMANDS.GCODE_REPORT
        );

        expect(controller.actionMask.replyParserState).toBe(false);
    });

    it('still flags ? and 0x87 for echo', () => {
        controller.write(GRBLHAL_REALTIME_COMMANDS.STATUS_REPORT);
        expect(controller.actionMask.replyStatusReport).toBe(true);

        const other = makeController();
        other.emit = () => {};
        other.write(GRBLHAL_REALTIME_COMMANDS.COMPLETE_REALTIME_REPORT);
        expect(other.actionMask.replyStatusReport).toBe(true);
        other.destroy();
    });
});
