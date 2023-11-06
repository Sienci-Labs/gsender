/* eslint camelcase: 0 */

import { SerialPort } from 'serialport';
import { getDeviceList } from 'usb';

class DFU {
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

    constructor(path) {
        this.port = path;
        console.log(this.port);
    }

    open(path) {
        const devices = getDeviceList();
        devices.map(d => console.log(`${d.deviceDescriptor.idVendor}`));
        const port = new SerialPort({
            path,
            baudRate: 115200
        }, (err) => {
            if (err) {
                console.log(err);
                return new Error(`Unable to open port on path ${path}`);
            }

            return port;
        });
    }


    writeData(bytes) {}

    writeCommand(bytes) {}
}

export default DFU;
