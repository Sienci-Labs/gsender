/* eslint camelcase: 0 */

import { findByIds } from 'usb';

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
        console.log(this.port);
    }

    async open(path) {
        const [vid, pid] = this.IDS;
        console.log(vid);

        const device = findByIds(vid, pid);
        if (device) {
            this.device = device;
            console.log(device);
            console.log(JSON.stringify(device.__getAllConfigDescriptors()));
            await this.device.__open();
            console.log(this.device.interfaces);
        } else {
            throw new Error('Unable to find valid device');
        }
    }


    writeData(bytes) {}

    writeCommand(bytes) {}
}

export default DFU;
