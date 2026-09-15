// See the note in GrblHalAxsProbe.test.js for why this uses require().
process.env.GSENDER_LOG_LEVEL = process.env.GSENDER_LOG_LEVEL || 'error';

const Connection = require('../Connection').default;
const { GRBL: GRBL_TYPE } = require('../../controllers/Grbl/constants');
const { GRBLHAL: GRBLHAL_TYPE } = require('../../controllers/Grblhal/constants');

// Must match FIRMWARE_DETECT_INTERVAL / FIRMWARE_DETECT_MAX_ATTEMPTS in Connection.js
const INTERVAL = 800;
const MAX_ATTEMPTS = 7;

// Stand in for SerialConnection: Connection constructs one internally, so patch
// the instance rather than mocking the module.
const stubSerial = (connection, { open = true } = {}) => {
    const serial = {
        isOpen: open,
        writes: [],
        write(data) {
            this.writes.push(String(data));
        },
        writeImmediate(data) {
            this.writes.push(String(data));
        },
        close() {
            this.isOpen = false;
        },
        on() {},
        open(callback) {
            callback(null);
        },
        setWriteFilter() {},
        addPortListeners() {}
    };
    connection.connection = serial;
    return serial;
};

const makeConnection = (options = {}) => {
    const engine = { io: null };
    const connection = new Connection(
        engine,
        '/dev/fake',
        { baudrate: 115200, defaultFirmware: GRBL_TYPE, ...options },
        () => {}
    );
    const serial = stubSerial(connection);
    return { connection, serial };
};

const countI = (serial) => serial.writes.filter((w) => w.trim() === '$I').length;

describe('Connection firmware detection', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('sends the first $I immediately', () => {
        const { connection, serial } = makeConnection();
        connection.startFirmwareDetection();

        expect(countI(serial)).toBe(1);
        connection.stopFirmwareDetection();
    });

    it('sends exactly MAX_ATTEMPTS queries, then gives up once', () => {
        const { connection, serial } = makeConnection();
        const found = [];
        connection.on('firmwareFound', (type) => found.push(type));

        connection.startFirmwareDetection();
        // Run well past the point of giving up.
        jest.advanceTimersByTime(INTERVAL * (MAX_ATTEMPTS + 20));

        expect(countI(serial)).toBe(MAX_ATTEMPTS);
        expect(found).toEqual([GRBL_TYPE]);
        expect(connection.controllerType).toBe(GRBL_TYPE);
    });

    it('does not send a pointless $I on the tick it gives up', () => {
        const { connection, serial } = makeConnection();
        connection.startFirmwareDetection();

        // Reach the last attempt.
        jest.advanceTimersByTime(INTERVAL * (MAX_ATTEMPTS - 1));
        expect(countI(serial)).toBe(MAX_ATTEMPTS);

        // The give-up tick must decide first and write nothing.
        jest.advanceTimersByTime(INTERVAL);
        expect(countI(serial)).toBe(MAX_ATTEMPTS);
    });

    it('stops polling as soon as the firmware identifies itself', () => {
        const { connection, serial } = makeConnection();
        const found = [];
        connection.on('firmwareFound', (type) => found.push(type));

        connection.startFirmwareDetection();
        expect(countI(serial)).toBe(1);

        connection.connectionEventListener.data('[VER:1.1f.20230131:]\r\n');
        connection.connectionEventListener.data('[OPT:VNMSL,35,1024,3,0]\r\n');
        connection.connectionEventListener.data('[FIRMWARE:grblHAL]\r\n');

        expect(found).toEqual([GRBLHAL_TYPE]);

        jest.advanceTimersByTime(INTERVAL * 20);
        expect(countI(serial)).toBe(1);
    });

    it('identifies plain grbl without falling back to the default', () => {
        const { connection } = makeConnection({ defaultFirmware: GRBLHAL_TYPE });
        const found = [];
        connection.on('firmwareFound', (type) => found.push(type));

        connection.startFirmwareDetection();
        connection.connectionEventListener.data("Grbl 1.1f ['$' for help]\r\n");

        expect(found).toEqual([GRBL_TYPE]);
    });

    it('stops instead of writing to a port that went away', () => {
        const { connection, serial } = makeConnection();
        connection.startFirmwareDetection();
        expect(countI(serial)).toBe(1);

        serial.isOpen = false; // unplugged mid-detection

        expect(() => jest.advanceTimersByTime(INTERVAL * 20)).not.toThrow();
        expect(countI(serial)).toBe(1);
        expect(connection.timeout).toBeNull();
    });

    it('never emits an undefined firmware type', () => {
        const { connection } = makeConnection({ defaultFirmware: undefined });
        const found = [];
        connection.on('firmwareFound', (type) => found.push(type));

        connection.startFirmwareDetection();
        jest.advanceTimersByTime(INTERVAL * (MAX_ATTEMPTS + 5));

        expect(found).toEqual([GRBL_TYPE]);
    });

    it('resets the attempt budget so detection can start over', () => {
        const { connection, serial } = makeConnection();
        connection.startFirmwareDetection();
        jest.advanceTimersByTime(INTERVAL * (MAX_ATTEMPTS + 5));
        expect(connection.count).toBe(MAX_ATTEMPTS);

        // A restart must get a full budget again, not inherit a spent one.
        serial.writes.length = 0;
        connection.controllerType = null;
        connection.startFirmwareDetection();
        jest.advanceTimersByTime(INTERVAL * (MAX_ATTEMPTS + 5));

        expect(countI(serial)).toBe(MAX_ATTEMPTS);
    });

    it('clears the budget and the timer on destroy', () => {
        const { connection, serial } = makeConnection();
        connection.startFirmwareDetection();

        connection.destroy();

        expect(connection.count).toBe(0);
        expect(connection.timeout).toBeNull();
        // destroy() nulls the serial connection; a stray tick would throw on it.
        expect(() => jest.advanceTimersByTime(INTERVAL * 20)).not.toThrow();
        expect(countI(serial)).toBe(1);
    });
});
