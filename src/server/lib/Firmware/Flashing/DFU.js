/* eslint camelcase: 0 */

import { findByIds, WebUSBDevice } from 'usb';
import { get } from 'lodash';
import logger from '../../logger';


const log = logger('DFU');

class DFU {
    IDS = [1155, 57105] // 0x0483 VID 0xDF11 PID for usb in DFU mode
    // DFU request commands
    static DETACH = 0x00;
    static DNLOAD = 0x01;
    static UPLOAD = 0x02;
    static GETSTATUS = 0x03;
    static CLRSTATUS = 0x04;
    static GETSTATE = 0x05;
    static ABORT = 6;
    static appIDLE = 0;
    static appDETACH = 1;

    // DFU states
    static dfuIDLE = 2;
    static dfuDNLOAD_SYNC = 3;
    static dfuDNBUSY = 4;
    static dfuDNLOAD_IDLE = 5;
    static dfuMANIFEST_SYNC = 6;
    static dfuMANIFEST = 7;
    static dfuMANIFEST_WAIT_RESET = 8;
    static dfuUPLOAD_IDLE = 9;
    static dfuERROR = 10;
    static STATUS_OK = 0x0;

    // Opcodes

    static dfu_SET_ADDRESS = 0x21;
    static dfu_ERASE_PAGE = 0x41;

    static DFU_TIMEOUT = 5000;

    constructor(path, options = {}) {
        this.path = path;
        this.options = options;
    }

    async open(path) {
        const [vid, pid] = this.IDS;

        const device = findByIds(vid, pid);
        if (device) {
            try {
                this.device = await WebUSBDevice.createInstance(device);
                await this.device.open();
                console.log(this.device);
                this.configurations = get(this.device, 'configurations');
                this.interfaces = this.configurations[0].interfaces;
                this.interface = this.interfaces[0];
                log.info('Device opened');
                console.log(this.interface);
                await this.close();
            } catch (e) {
                log.error(e);
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
            index: this.interfaceNumber
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
            index: this.interfaceNumber
        }, data)
            .then(
                (result) => {
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
}

export default DFU;
