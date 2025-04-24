/* eslint camelcase: 0 */
/* eslint no-await-in-loop: 0 */
/* eslint no-bitwise: 0 */
/*eslint no-cond-assign: 0 */

import { findByIds, WebUSBDevice } from 'usb';
import { get } from 'lodash';
import logger from '../../logger';
import delay from 'server/lib/delay';

const log = logger('DFU');

class DFU {
    IDS = [1155, 57105] // 0x0483 VID 0xDF11 PID for usb in DFU mode
    // DFU request commands
    DETACH = 0x00;
    DNLOAD = 0x01;
    UPLOAD = 0x02;
    GETSTATUS = 0x03;
    CLRSTATUS = 0x04;
    GETSTATE = 0x05;
    ABORT = 6;
    appIDLE = 0;
    appDETACH = 1;

    // DFU states
    dfuIDLE = 2;
    dfuDNLOAD_SYNC = 3;
    dfuDNBUSY = 4;
    dfuDNLOAD_IDLE = 5;
    dfuMANIFEST_SYNC = 6;
    dfuMANIFEST = 7;
    dfuMANIFEST_WAIT_RESET = 8;
    dfuUPLOAD_IDLE = 9;
    dfuERROR = 10;
    STATUS_OK = 0x0;

    // Opcodes

    dfu_SET_ADDRESS = 0x21;
    dfu_ERASE_PAGE = 0x41;

    DFU_TIMEOUT = 8000;

    constructor(path, options = {}) {
        this.path = path;
        this.options = options;
        this.segments = {};
        this.interfaceNumber = 0;
    }

    parseMemorySegments(desc = '') {
        log.info(desc);
        const nameEndIndex = desc.indexOf('/');
        if (!desc.startsWith('@' || nameEndIndex === -1)) {
            throw new Error(`Invalid description passed: ${desc}`);
        }

        const name = desc.substring(1, nameEndIndex).trim();
        const segmentString = desc.sub(nameEndIndex);
        const segments = [];

        // Char to value multiplier
        const sectorMultipliers = {
            ' ': 1,
            'B': 1,
            'K': 1024,
            'M': 1048576
        };

        let contiguousSegmentRegex = /\/\s*(0x[0-9a-fA-F]{1,8})\s*\/(\s*[0-9]+\s*\*\s*[0-9]+\s?[ BKM]\s*[abcdefg]\s*,?\s*)+/g;
        let contiguousSegmentMatch;

        while (contiguousSegmentMatch = contiguousSegmentRegex.exec(segmentString)) {
            let segmentRegex = /([0-9]+)\s*\*\s*([0-9]+)\s?([ BKM])\s*([abcdefg])\s*,?\s*/g;
            let startAddress = parseInt(contiguousSegmentMatch[1], 16);
            let segmentMatch;
            while (segmentMatch = segmentRegex.exec(contiguousSegmentMatch[0])) {
                let segment = {};
                let sectorCount = parseInt(segmentMatch[1], 10);
                let sectorSize = parseInt(segmentMatch[2], 10) * sectorMultipliers[segmentMatch[3]];
                let properties = segmentMatch[4].charCodeAt(0) - 'a'.charCodeAt(0) + 1;
                segment.start = startAddress;
                segment.sectorSize = sectorSize;
                segment.end = startAddress + sectorSize * sectorCount;
                segment.readable = (properties & 0x1) !== 0;
                segment.erasable = (properties & 0x2) !== 0;
                segment.writable = (properties & 0x4) !== 0;
                segments.push(segment);

                startAddress += sectorSize * sectorCount;
            }
        }

        this.segments = {
            name,
            segments
        };

        return this.segments;
    }

    getSegment(addr) {
        const { segments } = this.segments;

        for (let segment of segments) {
            if (segment.start <= addr && addr < segment.end) {
                return segment;
            }
        }
        return null;
    }

    async open() {
        const [vid, pid] = this.IDS;

        const device = findByIds(vid, pid);
        if (!device) {
            throw new Error(`Unable to find valid device using vendor ID "${vid.toString(16)}" and product ID "${pid.toString(16)}".  Make sure the device is in DFU mode.`);
        }

        if (device) {
            device.timeout = this.DFU_TIMEOUT;
            try {
                this.device = await WebUSBDevice.createInstance(device);

                await this.device.open();
                await delay(450);

                this.configurations = get(this.device, 'configurations');
                this.interfaces = this.configurations[0].interfaces;
                this.interface = this.interfaces[0];

                const alternate = this.interface.alternates[0];
                this.parseMemorySegments(alternate.interfaceName);

                await this.device.selectConfiguration(this.configurations[0].configurationValue);
                await this.device.claimInterface(this.interface.interfaceNumber);

                await this.device.selectAlternateInterface(0, alternate.alternateSetting);
                log.info('Device opened');
            } catch (e) {
                log.error(e);
                throw new Error(`Open failed: ${e.message}`);
            }
        } else {
            log.error('Unable to find valid DFU device');
            throw new Error('Unable to find valid device');
        }
    }

    requestIn(bRequest, wLength, wValue = 0) {
        return this.device.controlTransferIn({
            requestType: 'class',
            recipient: 'interface',
            request: bRequest,
            value: wValue,
            index: this.interface.interfaceNumber
        }, wLength)
            .then((result) => {
                if (result.status === 'ok') {
                    return Promise.resolve(result.data);
                } else {
                    return Promise.resolve(result.status);
                }
            }, (err) => {
                log.error(err);
                return Promise.reject(`requestIn Fail: ${err}`);
            });
    }

    requestOut(bRequest, data, wValue = 0) {
        return this.device.controlTransferOut({
            requestType: 'class',
            recipient: 'interface',
            request: bRequest,
            value: wValue,
            index: 0
        }, data)
            .then(
                (result) => {
                    log.info(result);
                    if (result.status === 'ok') {
                        return Promise.resolve(result.bytesWritten);
                    } else {
                        return Promise.reject(result.status);
                    }
                },
                (err) => {
                    log.error(err);
                    return Promise.reject(`requestOut Fail: ${err}`);
                }
            );
    }

    async close() {
        try {
            this.device && await this.device.close();
        } catch (err) {
            log.err(err);
        }
    }

    getStatus() {
        return this.requestIn(this.GETSTATUS, 6).then(
            data => Promise.resolve({
                status: data.getUint8(0),
                pollTimeout: data.getUint32(1, true) & 0xFFFFFF,
                state: data.getUint8(4)
            }),
            error => Promise.reject(`DFU GETSTATUS failed: ${error}`)
        );
    }

    getState() {
        return this.requestIn(this.GETSTATE, 1).then(
            data => Promise.resolve(data.getUint8(0)),
            error => Promise.reject(`DFU getState error: ${error}`)
        );
    }

    async pollUntil(predicate) {
        let dfuStatus = await this.getStatus();
        log.info(dfuStatus);

        while (!predicate(dfuStatus.state) && dfuStatus.state !== this.dfuERROR) {
            await delay(dfuStatus.pollTimeout);
            dfuStatus = await this.getStatus();
        }
        return dfuStatus;
    }

    pollUntilIdle(idle_state) {
        return this.pollUntil(state => (state === idle_state));
    }

    abort() {
        return this.requestOut(this.ABORT);
    }

    async abortToIdle() {
        await this.abort();
        let state = await this.getState();
        if (state === this.dfuERROR) {
            await this.clearStatus();
            state = await this.getState();
        }
        if (state !== this.dfuIDLE) {
            throw new Error('Failed to return to idle state after abort');
        }
    }

    clearStatus() {
        return this.requestOut(this.CLRSTATUS);
    }

    upload(length, blockNum) {
        return this.requestIn(this.UPLOAD, length, blockNum);
    }

    download(data, blockNum) {
        return this.requestOut(this.DNLOAD, data, blockNum);
    }

    detach() {
        return this.requestOut(this.DETACH, undefined, 1000);
    }
}

export default DFU;
