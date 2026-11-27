/**
 * Tests for the WebHID 6DOF driver using fake HID devices built from real
 * (and synthetic but spec-valid) report descriptors.
 */

const GD = 0x01 << 16; // Generic Desktop usage page, extended-usage form
const BTN = 0x09 << 16; // Button usage page
const X = GD | 0x30;
const Y = GD | 0x31;
const Z = GD | 0x32;
const RX = GD | 0x33;
const RY = GD | 0x34;
const RZ = GD | 0x35;

type Item = Record<string, unknown>;
type Report = { reportId: number; items: Item[] };

class FakeDevice extends EventTarget {
    opened = false;
    vendorId: number;
    productId = 0x1234;
    productName: string;
    collections: unknown[];

    constructor(
        vendorId: number,
        productName: string,
        inputReports: Report[],
        usage = 0x08,
    ) {
        super();
        this.vendorId = vendorId;
        this.productName = productName;
        this.collections = [
            { usagePage: 0x01, usage, children: [], inputReports },
        ];
    }

    async open() {
        this.opened = true;
    }

    async close() {
        this.opened = false;
    }

    send(reportId: number, bytes: number[]) {
        const event = new Event('inputreport') as Event & {
            device: FakeDevice;
            reportId: number;
            data: DataView;
        };
        event.device = this;
        event.reportId = reportId;
        event.data = new DataView(new Uint8Array(bytes).buffer);
        this.dispatchEvent(event);
    }
}

const int16 = (v: number) => [v & 0xff, (v >> 8) & 0xff];

// Load a fresh driver instance with the given devices already permitted.
async function loadDriver(devices: FakeDevice[]) {
    const hid = new EventTarget() as EventTarget & {
        getDevices: () => Promise<FakeDevice[]>;
        requestDevice: () => Promise<FakeDevice[]>;
    };
    hid.getDevices = async () => devices;
    hid.requestDevice = async () => devices;
    Object.defineProperty(navigator, 'hid', {
        value: hid,
        configurable: true,
    });

    jest.resetModules();
    const mod = await import('app/lib/spacemouse');
    const spaceMouse = mod.default;
    spaceMouse.init();
    // let getDevices() + open() resolve
    await new Promise((r) => setTimeout(r, 0));
    return { spaceMouse, hid };
}

describe('spacemouse driver', () => {
    afterEach(() => {
        // @ts-ignore
        delete (navigator as { hid?: unknown }).hid;
    });

    it('reads a combined 6-axis report (SpaceMouse Compact/Wireless style)', async () => {
        const device = new FakeDevice(0x256f, 'SpaceMouse Compact', [
            {
                reportId: 1,
                items: [
                    {
                        usages: [X, Y, Z, RX, RY, RZ],
                        reportSize: 16,
                        reportCount: 6,
                        logicalMinimum: -350,
                        logicalMaximum: 350,
                    },
                ],
            },
            {
                reportId: 3,
                items: [
                    {
                        isRange: true,
                        usageMinimum: BTN | 1,
                        usageMaximum: BTN | 2,
                        reportSize: 1,
                        reportCount: 2,
                        logicalMinimum: 0,
                        logicalMaximum: 1,
                    },
                    { reportSize: 1, reportCount: 14 }, // padding
                ],
            },
        ]);
        const { spaceMouse } = await loadDriver([device]);
        expect(spaceMouse.isConnected).toBe(true);
        expect(spaceMouse.deviceName).toBe('SpaceMouse Compact');

        device.send(1, [
            ...int16(350),
            ...int16(-175),
            ...int16(0),
            ...int16(70),
            ...int16(-350),
            ...int16(500), // out of range, clamps
        ]);
        expect(spaceMouse.getAxes()).toEqual({
            tx: 1,
            ty: -0.5,
            tz: 0,
            rx: 0.2,
            ry: -1,
            rz: 1,
        });

        const buttons: unknown[] = [];
        spaceMouse.on('button', (e) => buttons.push(e));
        device.send(3, [0b10, 0]);
        device.send(3, [0b00, 0]);
        expect(buttons).toEqual([
            { button: 1, pressed: true },
            { button: 1, pressed: false },
        ]);
    });

    it('reads split translation/rotation reports (SpaceNavigator style)', async () => {
        const axisItem = (usages: number[]) => ({
            usages,
            reportSize: 16,
            reportCount: 3,
            logicalMinimum: -350,
            logicalMaximum: 350,
        });
        const device = new FakeDevice(0x046d, 'SpaceNavigator', [
            { reportId: 1, items: [axisItem([X, Y, Z])] },
            { reportId: 2, items: [axisItem([RX, RY, RZ])] },
        ]);
        const { spaceMouse } = await loadDriver([device]);

        device.send(1, [...int16(35), ...int16(0), ...int16(-35)]);
        device.send(2, [...int16(0), ...int16(175), ...int16(0)]);
        expect(spaceMouse.getAxes()).toEqual({
            tx: 0.1,
            ty: 0,
            tz: -0.1,
            rx: 0,
            ry: 0.5,
            rz: 0,
        });
    });

    it('supports a non-3Dconnexion device with a different layout', async () => {
        // Report ID 0, buttons first, 8-bit axes in a different order.
        const device = new FakeDevice(0x1209, 'DIY 6DOF Knob', [
            {
                reportId: 0,
                items: [
                    {
                        isRange: true,
                        usageMinimum: BTN | 1,
                        usageMaximum: BTN | 4,
                        reportSize: 1,
                        reportCount: 4,
                        logicalMinimum: 0,
                        logicalMaximum: 1,
                    },
                    { reportSize: 4, reportCount: 1 }, // padding
                    {
                        usages: [RZ, RY, RX, Z, Y, X],
                        reportSize: 8,
                        reportCount: 6,
                        logicalMinimum: -127,
                        logicalMaximum: 127,
                    },
                ],
            },
        ]);
        const { spaceMouse } = await loadDriver([device]);
        expect(spaceMouse.isConnected).toBe(true);

        const buttons: unknown[] = [];
        spaceMouse.on('button', (e) => buttons.push(e));
        // byte0: button 1 pressed; then rz, ry, rx, z, y, x
        device.send(0, [0b0001, 127, 0, 0x81 /* -127 */, 0, 0, 127]);
        expect(spaceMouse.getAxes()).toEqual({
            tx: 1,
            ty: 0,
            tz: 0,
            rx: -1,
            ry: 0,
            rz: 1,
        });
        expect(buttons).toEqual([{ button: 0, pressed: true }]);
    });

    it('falls back to the fixed layout for 3Dconnexion devices without descriptor info', async () => {
        const device = new FakeDevice(0x256f, 'SpaceMouse Pro', []);
        const { spaceMouse } = await loadDriver([device]);
        expect(spaceMouse.isConnected).toBe(true);

        device.send(1, [...int16(-350), ...int16(0), ...int16(0)]);
        expect(spaceMouse.getAxes().tx).toBe(-1);
    });

    it('ignores devices that are not multi-axis controllers', async () => {
        const joystick = new FakeDevice(
            0x1209,
            'Joystick',
            [
                {
                    reportId: 0,
                    items: [
                        {
                            usages: [X, Y],
                            reportSize: 8,
                            reportCount: 2,
                            logicalMinimum: -127,
                            logicalMaximum: 127,
                        },
                    ],
                },
            ],
            0x04,
        );
        const { spaceMouse } = await loadDriver([joystick]);
        expect(spaceMouse.isConnected).toBe(false);
        expect(joystick.opened).toBe(false);
    });

    it('resets axes when the device disconnects', async () => {
        const device = new FakeDevice(0x256f, 'SpaceMouse Compact', [
            {
                reportId: 1,
                items: [
                    {
                        usages: [X, Y, Z, RX, RY, RZ],
                        reportSize: 16,
                        reportCount: 6,
                        logicalMinimum: -350,
                        logicalMaximum: 350,
                    },
                ],
            },
        ]);
        const { spaceMouse, hid } = await loadDriver([device]);
        device.send(1, [...int16(350), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        expect(spaceMouse.getAxes().tx).toBe(1);

        const disconnect = new Event('disconnect') as Event & {
            device: FakeDevice;
        };
        disconnect.device = device;
        hid.dispatchEvent(disconnect);

        expect(spaceMouse.isConnected).toBe(false);
        expect(spaceMouse.getAxes().tx).toBe(0);
    });
});
