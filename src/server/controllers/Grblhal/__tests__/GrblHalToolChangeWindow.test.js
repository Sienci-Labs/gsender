// NOTE: require(), not import - see GrblHalAxsProbe.test.js for why the log
// level has to be set before the controller module graph loads.
process.env.GSENDER_LOG_LEVEL = process.env.GSENDER_LOG_LEVEL || 'error';

const events = require('events');
const GrblHalController = require('../GrblHalController').default;

// PRB only updates a tool offset while a passed-through M6 is in flight (the
// firmware's tool change macro is probing). Outside that window the firmware
// tool table, read with $#, is the source of truth - so $# is re-sent when a
// job ends.

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
        { port: '/dev/fake', baudrate: 115200 },
    );
    controller.ready = true;
    controller.initialized = true;
    controller.emit = () => {}; // don't broadcast to sockets
    // The feeder's populateContext reads firmware settings ($13 etc.)
    controller.runner.settings.settings = {};
    controller.settings = controller.runner.settings;
    return { controller, connection };
};

const countToolTableReads = (connection) =>
    connection.writes.filter((write) => write.trim() === '$#').length;

const seedTool = (controller) => {
    controller.runner.settings.toolTable = {
        1: { toolOffsets: { x: 1, y: 2, z: 3 } },
    };
    controller.runner.state.status.currentTool = 1;
};

describe('GrblHalController tool change window', () => {
    let controller;
    let connection;

    beforeEach(() => {
        ({ controller, connection } = makeController());
    });

    afterEach(() => {
        controller.destroy();
    });

    it('opens the window for a passed-through M6', () => {
        controller.toolChangeContext = {
            toolChangeOption: 'Ignore',
            passthrough: true,
        };
        controller.sender.state.sent = 4;

        const line = controller.sender.dataFilter('M6 T1', {});

        expect(line).toMatch(/^M6 T1/);
        expect(controller.toolChangeLine).toBe(5);
    });

    it('leaves the window closed when M6 is commented out', () => {
        controller.toolChangeContext = {
            toolChangeOption: 'Ignore',
            passthrough: false,
        };

        const line = controller.sender.dataFilter('M6 T1', {});

        expect(line).toContain('(M6)');
        expect(controller.toolChangeLine).toBeNull();
    });

    it('applies PRB to the tool offset only while the window is open', () => {
        seedTool(controller);

        controller.toolChangeLine = 5;
        controller.runner.parse('[PRB:5.000,6.000,7.000:1]');
        expect(controller.runner.settings.toolTable[1].toolOffsets).toEqual({
            x: 1,
            y: 2,
            z: 7,
        });

        controller.toolChangeLine = null;
        controller.runner.parse('[PRB:9.000,9.000,9.000:1]');
        expect(controller.runner.settings.toolTable[1].toolOffsets.z).toBe(7);
    });

    it('closes the window once the M6 line is acked', () => {
        controller.toolChangeLine = 5;

        controller.sender.state.received = 4;
        controller.clearToolChangeWindowIfAcked();
        expect(controller.toolChangeLine).toBe(5);

        controller.sender.state.received = 5;
        controller.clearToolChangeWindowIfAcked();
        expect(controller.toolChangeLine).toBeNull();
    });

    it('closes the window when the workflow stops', () => {
        controller.toolChangeLine = 5;
        controller.workflow.start();
        controller.workflow.stop();

        expect(controller.toolChangeLine).toBeNull();
    });

    it('re-reads the tool table when a job is stopped', () => {
        controller.command('gcode:stop');

        expect(countToolTableReads(connection)).toBe(1);
    });

    it('re-reads the tool table after the reset of a force stop', () => {
        controller.pendingToolTableResync = true;
        controller.toolChangeLine = 5;

        controller.runner.parse("GrblHAL 1.1f ['$' or '$HELP' for help]");

        expect(countToolTableReads(connection)).toBe(1);
        expect(controller.pendingToolTableResync).toBe(false);
        expect(controller.toolChangeLine).toBeNull();
    });

    it('does not re-read the tool table on an ordinary startup', () => {
        controller.runner.parse("GrblHAL 1.1f ['$' or '$HELP' for help]");

        expect(countToolTableReads(connection)).toBe(0);
    });
});
