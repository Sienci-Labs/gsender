/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

/**
 * 6DOF input driver ("SpaceMouse") built on WebHID.
 *
 * Works with any HID device that exposes a Generic Desktop / Multi-axis
 * Controller collection (3Dconnexion SpaceMouse family and compatible
 * devices). Axis and button positions are read from the device's HID report
 * descriptor; a fixed 3Dconnexion layout is used as a fallback if the
 * descriptor doesn't describe them.
 *
 * Exposes the latest normalized state (-1..1 per axis) in the standard HID
 * multi-axis frame used by these devices: +X right, +Y toward the user,
 * +Z down; rotations follow the right-hand rule about those axes.
 *
 * Consumers poll `getAxes()` from their own animation loop and listen to
 * `button` / `connection` events.
 */

import { EventEmitter } from 'events';

export const USAGE_PAGE_GENERIC_DESKTOP = 0x01;
export const USAGE_MULTI_AXIS_CONTROLLER = 0x08;
const USAGE_PAGE_BUTTON = 0x09;
// Generic Desktop X, Y, Z, Rx, Ry, Rz
const USAGE_X = 0x30;
const USAGE_RZ = 0x35;

// 3Dconnexion devices (older ones use Logitech's vendor ID). Only used to
// decide whether the hard-coded fallback report layout is safe to apply.
const LEGACY_LAYOUT_VENDOR_IDS = [0x046d, 0x256f];
const LEGACY_AXIS_FULL_SCALE = 350;

const AXIS_KEYS = ['tx', 'ty', 'tz', 'rx', 'ry', 'rz'] as const;

export type SpaceMouseAxes = {
    tx: number;
    ty: number;
    tz: number;
    rx: number;
    ry: number;
    rz: number;
};

export type SpaceMouseButtonEvent = {
    button: number;
    pressed: boolean;
};

// Minimal WebHID typings so we don't need @types/w3c-web-hid.
interface HIDReportItem {
    isRange?: boolean;
    usages?: number[];
    usageMinimum?: number;
    usageMaximum?: number;
    reportSize?: number;
    reportCount?: number;
    logicalMinimum?: number;
    logicalMaximum?: number;
}
interface HIDReportInfo {
    reportId?: number;
    items?: HIDReportItem[];
}
interface HIDCollectionInfo {
    usagePage?: number;
    usage?: number;
    children?: HIDCollectionInfo[];
    inputReports?: HIDReportInfo[];
}
interface HIDInputReportEvent extends Event {
    device: HIDDevice;
    reportId: number;
    data: DataView;
}
interface HIDDevice extends EventTarget {
    opened: boolean;
    vendorId: number;
    productId: number;
    productName: string;
    collections: HIDCollectionInfo[];
    open(): Promise<void>;
    close(): Promise<void>;
}
interface HIDConnectionEvent extends Event {
    device: HIDDevice;
}
interface HID extends EventTarget {
    getDevices(): Promise<HIDDevice[]>;
    requestDevice(options: {
        filters: Array<{
            vendorId?: number;
            usagePage?: number;
            usage?: number;
        }>;
    }): Promise<HIDDevice[]>;
}

type AxisField = {
    axis: number; // index into AXIS_KEYS
    bitOffset: number;
    bitSize: number;
    signed: boolean;
    scale: number; // divide raw value by this to normalize
};
type ButtonField = {
    button: number; // 0-based
    bitOffset: number;
};
type ReportLayout = { axes: AxisField[]; buttons: ButtonField[] };
type DeviceLayout = Map<number, ReportLayout>; // keyed by report ID

const getHID = (): HID | null => {
    const nav = navigator as Navigator & { hid?: HID };
    return nav && nav.hid ? nav.hid : null;
};

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

const isMultiAxisCollection = (c: HIDCollectionInfo) =>
    c.usagePage === USAGE_PAGE_GENERIC_DESKTOP &&
    c.usage === USAGE_MULTI_AXIS_CONTROLLER;

export const isSpaceMouse = (device: HIDDevice): boolean =>
    device.collections.some(isMultiAxisCollection);

const readBits = (
    data: DataView,
    bitOffset: number,
    bitSize: number,
    signed: boolean,
): number | null => {
    if (bitSize <= 0 || bitSize > 32) {
        return null;
    }
    if (bitOffset + bitSize > data.byteLength * 8) {
        return null;
    }
    let value = 0;
    for (let i = 0; i < bitSize; i++) {
        const bit = bitOffset + i;
        if (data.getUint8(bit >> 3) & (1 << (bit & 7))) {
            value += 2 ** i;
        }
    }
    if (signed && value >= 2 ** (bitSize - 1)) {
        value -= 2 ** bitSize;
    }
    return value;
};

/**
 * Build a report layout from the HID report descriptor (as exposed by
 * WebHID). Report items are packed LSB-first in declaration order.
 */
export const buildLayout = (device: HIDDevice): DeviceLayout => {
    const layout: DeviceLayout = new Map();

    const visit = (collection: HIDCollectionInfo) => {
        (collection.inputReports || []).forEach((report) => {
            const reportId = report.reportId ?? 0;
            const entry = layout.get(reportId) || { axes: [], buttons: [] };
            let bitOffset = 0;

            (report.items || []).forEach((item) => {
                const size = item.reportSize ?? 0;
                const count = item.reportCount ?? 0;
                const usages = item.usages || [];

                for (let i = 0; i < count; i++) {
                    let usage: number | undefined;
                    if (item.isRange) {
                        const min = item.usageMinimum ?? 0;
                        const max = item.usageMaximum ?? min;
                        usage = min + i <= max ? min + i : undefined;
                    } else {
                        usage = usages[i] ?? usages[usages.length - 1];
                    }
                    const fieldOffset = bitOffset + i * size;

                    if (usage !== undefined) {
                        const page = usage >>> 16;
                        const id = usage & 0xffff;
                        if (
                            page === USAGE_PAGE_GENERIC_DESKTOP &&
                            id >= USAGE_X &&
                            id <= USAGE_RZ
                        ) {
                            const lmin = item.logicalMinimum ?? 0;
                            const lmax = item.logicalMaximum ?? 0;
                            const scale = Math.max(
                                Math.abs(lmin),
                                Math.abs(lmax),
                            );
                            // Only centred (signed) axes make sense for a 6DOF cap
                            if (lmin < 0 && scale > 0) {
                                entry.axes.push({
                                    axis: id - USAGE_X,
                                    bitOffset: fieldOffset,
                                    bitSize: size,
                                    signed: true,
                                    scale,
                                });
                            }
                        } else if (
                            page === USAGE_PAGE_BUTTON &&
                            size === 1 &&
                            id >= 1
                        ) {
                            entry.buttons.push({
                                button: id - 1,
                                bitOffset: fieldOffset,
                            });
                        }
                    }
                }
                bitOffset += size * count;
            });

            if (entry.axes.length || entry.buttons.length) {
                layout.set(reportId, entry);
            }
        });
        (collection.children || []).forEach(visit);
    };

    device.collections.filter(isMultiAxisCollection).forEach(visit);
    return layout;
};

class SpaceMouse extends EventEmitter {
    private axes: SpaceMouseAxes = { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0 };
    private buttons = 0;
    private devices = new Map<HIDDevice, DeviceLayout | null>();
    private initialized = false;

    get isSupported(): boolean {
        return getHID() !== null;
    }

    get isConnected(): boolean {
        return this.devices.size > 0;
    }

    get deviceName(): string {
        const [first] = Array.from(this.devices.keys());
        return first ? first.productName : '';
    }

    getAxes(): SpaceMouseAxes {
        return this.axes;
    }

    /**
     * Start listening for devices. Opens any device the app already has
     * permission for (in Electron, the main process grants this automatically).
     */
    init(): void {
        const hid = getHID();
        if (this.initialized || !hid) {
            return;
        }
        this.initialized = true;

        hid.addEventListener('connect', (e: Event) => {
            const { device } = e as HIDConnectionEvent;
            if (isSpaceMouse(device)) {
                this.open(device);
            }
        });
        hid.addEventListener('disconnect', (e: Event) => {
            this.forget((e as HIDConnectionEvent).device);
        });

        hid.getDevices()
            .then((devices) => {
                devices.filter(isSpaceMouse).forEach((d) => this.open(d));
            })
            .catch((err) => {
                console.warn('SpaceMouse: unable to enumerate devices', err);
            });
    }

    /**
     * Prompt the user to pick a device. Must be called from a user gesture
     * (e.g. a click handler) when running in a regular browser.
     */
    async requestDevice(): Promise<boolean> {
        const hid = getHID();
        if (!hid) {
            return false;
        }
        this.init();
        const devices = await hid.requestDevice({
            filters: [
                {
                    usagePage: USAGE_PAGE_GENERIC_DESKTOP,
                    usage: USAGE_MULTI_AXIS_CONTROLLER,
                },
            ],
        });
        await Promise.all(
            devices.filter(isSpaceMouse).map((d) => this.open(d)),
        );
        return this.isConnected;
    }

    private async open(device: HIDDevice): Promise<void> {
        if (this.devices.has(device)) {
            return;
        }
        let layout: DeviceLayout | null = buildLayout(device);
        const hasAxes = Array.from(layout.values()).some((r) => r.axes.length);
        if (!hasAxes) {
            if (!LEGACY_LAYOUT_VENDOR_IDS.includes(device.vendorId)) {
                console.warn(
                    `SpaceMouse: ${device.productName} does not describe any 6DOF axes; ignoring`,
                );
                return;
            }
            layout = null; // use the fixed 3Dconnexion layout
        }

        try {
            if (!device.opened) {
                await device.open();
            }
        } catch (err) {
            console.warn(
                `SpaceMouse: failed to open ${device.productName}`,
                err,
            );
            return;
        }
        device.addEventListener('inputreport', this.handleInputReport);
        this.devices.set(device, layout);
        this.emit('connection', { connected: true, name: device.productName });
    }

    private forget(device: HIDDevice): void {
        if (!this.devices.has(device)) {
            return;
        }
        device.removeEventListener('inputreport', this.handleInputReport);
        this.devices.delete(device);
        this.resetAxes();
        this.buttons = 0;
        this.emit('connection', {
            connected: this.isConnected,
            name: this.deviceName,
        });
    }

    private resetAxes(): void {
        this.axes = { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0 };
    }

    private handleInputReport = (e: Event): void => {
        const { device, reportId, data } = e as HIDInputReportEvent;
        const layout = this.devices.get(device);

        if (layout === undefined) {
            return;
        }
        if (layout === null) {
            this.handleLegacyReport(reportId, data);
            return;
        }

        const report = layout.get(reportId);
        if (!report) {
            return;
        }
        report.axes.forEach((field) => {
            const raw = readBits(
                data,
                field.bitOffset,
                field.bitSize,
                field.signed,
            );
            const key = AXIS_KEYS[field.axis];
            if (raw !== null && key) {
                this.axes[key] = clamp(raw / field.scale);
            }
        });
        if (report.buttons.length) {
            let mask = this.buttons;
            report.buttons.forEach((field) => {
                if (field.button >= 32) {
                    return;
                }
                const bit = 1 << field.button;
                const value = readBits(data, field.bitOffset, 1, false);
                mask = value ? mask | bit : mask & ~bit;
            });
            this.updateButtons(mask >>> 0);
        }
    };

    // Fixed 3Dconnexion layout: report 1 = translation (+ rotation on newer
    // devices, 12 bytes), report 2 = rotation, report 3 = button bitmask.
    private handleLegacyReport(reportId: number, data: DataView): void {
        const n = (offset: number) =>
            clamp(data.getInt16(offset, true) / LEGACY_AXIS_FULL_SCALE);

        switch (reportId) {
            case 1:
                if (data.byteLength >= 6) {
                    this.axes.tx = n(0);
                    this.axes.ty = n(2);
                    this.axes.tz = n(4);
                }
                if (data.byteLength >= 12) {
                    this.axes.rx = n(6);
                    this.axes.ry = n(8);
                    this.axes.rz = n(10);
                }
                break;
            case 2:
                if (data.byteLength >= 6) {
                    this.axes.rx = n(0);
                    this.axes.ry = n(2);
                    this.axes.rz = n(4);
                }
                break;
            case 3: {
                let mask = 0;
                const len = Math.min(data.byteLength, 4);
                for (let i = 0; i < len; i++) {
                    mask |= data.getUint8(i) << (8 * i);
                }
                this.updateButtons(mask >>> 0);
                break;
            }
            default:
                break;
        }
    }

    private updateButtons(mask: number): void {
        const changed = (mask ^ this.buttons) >>> 0;
        this.buttons = mask;
        for (let i = 0; i < 32; i++) {
            const bit = (1 << i) >>> 0;
            if (changed & bit) {
                const event: SpaceMouseButtonEvent = {
                    button: i,
                    pressed: (mask & bit) !== 0,
                };
                this.emit('button', event);
            }
        }
    }
}

const spaceMouse = new SpaceMouse();

export default spaceMouse;
