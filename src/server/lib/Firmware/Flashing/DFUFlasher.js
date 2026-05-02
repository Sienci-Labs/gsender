/* eslint no-await-in-loop: 0 */

import DFU from './DFU';
import hexParser from 'nrf-intel-hex';
import logger from '../../logger';
import events from 'events';


//const VALID_VENDOR_IDS = [0x0483];
//const VALID_DEVICE_ID = [0x441];
//const START_ADDRESS = 0x08000000;

/*
  10:53:45 : erasing sector 0000 @: 0x08000000 done
  10:53:46 : erasing sector 0001 @: 0x08004000 done
  10:53:46 : erasing sector 0002 @: 0x08008000 done
  10:53:46 : erasing sector 0003 @: 0x0800c000 done
  10:53:47 : erasing sector 0004 @: 0x08010000 done
  10:53:49 : erasing sector 0005 @: 0x08020000 done

  Sector Sizes:
  0x08000000 16k
  0x08004000 16k
  0x08008000 16k
  0x0800c000 16k
  0x08010000 64k
  0x08020000 128k+
 */

const log = logger('DFUFlasher');

class DFUFlasher extends events.EventEmitter {
    SET_ADDRESS = 0x21;

    ERASE_PAGE = 0x41;

    XFER_SIZE = 2048; // we evaluate this

    constructor({ hex, ...options }) {
        super();
        this.options = options;
        this.hex = Buffer.from(hex, 'utf-8').toString();
        this.dfu = new DFU(this.path, {
            ...options,
            onInfo: (message) => this.emit('info', message)
        });
    }

    async flash() {
        try {
            await this.dfu.open();
        } catch (e) {
            this.emit('error', e.message);
            return;
        }

        try {
            this.map = this.parseHex(this.hex);
        } catch (e) {
            this.emit('error', `Invalid hex file: ${e.message}`);
            return;
        }

        let startAddress = null;
        let byteSize = 0;

        for (let [address, dataBlock] of this.map) {
            if (!startAddress) {
                startAddress = address;
            }
            byteSize += dataBlock.byteLength;
        }

        try {
            await this.dfu.abortToIdle();
            log.info('Aborted to IDLE state');
        } catch (e) {
            this.emit('error', e.message);
            return;
        }

        // Erase chip
        const eraseSuccess = await this.erase(startAddress, byteSize);
        if (!eraseSuccess) {
            return;
        }


        for (let [address, dataBlock] of this.map) {
            this.emit('info', `Writing block of size ${dataBlock.byteLength} at address 0x${address.toString(16)}`);
            const downloadSuccess = await this.download(address, this.XFER_SIZE, dataBlock);
            if (!downloadSuccess) {
                return;
            }
        }

        try {
            await this.dfu.abortToIdle();
        } catch (e) {
            this.emit('error', e.message);
            return;
        }
        log.info(`Jumping back to start address ${startAddress} to manifest`);
        try {
            await this.sendDFUCommand(this.SET_ADDRESS, startAddress, 4);
            const status = await this.dfu.getStatus();
            log.info(status);
            await this.dfu.download(new ArrayBuffer(0), 0);
            await this.dfu.pollUntil(state => (state === this.dfu.dfuMANIFEST));
        } catch (error) {
            this.emit('error', error.message || error);
            return;
        }

        await this.dfu.close();
        this.emit('end');
    }

    /**
     * Returns parsed data from either string path or file blob
     * @returns {Buffer|*}
     */
    parseHex() {
        try {
            return hexParser.fromHex(this.hex);
        } catch (err) {
            throw err;
        }
    }

    async download(startAddress, xferSize, data) {
        log.info('Starting download to board');

        let bytesSent = 0;
        let expectedSize = data.byteLength;
        let chunks = 1;

        let address = startAddress;
        while (bytesSent < expectedSize) {
            const bytesLeft = expectedSize - bytesSent;
            const chunkSize = Math.min(bytesLeft, xferSize);

            let bytesWritten = 0;
            let dfuStatus;
            try {
                await this.sendDFUCommand(this.SET_ADDRESS, address, 4);
                await this.dfu.getStatus();
                bytesWritten = await this.dfu.download(data.slice(bytesSent, bytesSent + chunkSize), 2);
                this.emit('info', `Wrote chunk ${chunks} with size ${bytesWritten}b`);
                dfuStatus = await this.dfu.pollUntilIdle(this.dfu.dfuDNLOAD_IDLE);
                address += chunkSize;
                chunks += 1;
            } catch (e) {
                log.error(e);
                this.emit('error', `Error during download: ${e.message || e}`);
                return false;
            }

            if (dfuStatus.status !== this.dfu.STATUS_OK) {
                this.emit('error', `DFU download failed: state=${dfuStatus.state}, status=${dfuStatus.status}`);
                return false;
            }

            bytesSent += bytesWritten;
            this.logProgress(bytesSent, expectedSize);
        }
        log.info('Finished download chunk');
        return true;
    }

    /**
     * Return buffer from string of hex characters
     * @param line string hex value
     * @returns {Buffer}
     */
    hexStringToByte(line) {
        return Buffer.from([parseInt(line, 16)]);
    }

    getSectorStart(addr, segment) {
        const sectorIndex = Math.floor((addr - segment.start) / segment.sectorSize);
        return segment.start + sectorIndex * segment.sectorSize;
    }

    getSectorEnd(addr, segment) {
        const sectorIndex = Math.floor((addr - segment.start) / segment.sectorSize);
        return segment.start + (sectorIndex + 1) * segment.sectorSize;
    }

    logProgress(value, total) {
        this.emit('progress', value, total);
    }

    async erase(startAddr, length) {
        this.emit('info', `Erasing chip starting at address ${startAddr.toString(16)} - size ${length}`);
        let segment = this.dfu.getSegment(startAddr);
        if (!segment) {
            this.emit('error', 'Invalid segment in memory map');
            log.error(`Unable to find valid segment for address ${startAddr}`);
            return false;
        }
        let addr = this.getSectorStart(startAddr, segment);
        let endAddr = this.getSectorEnd(startAddr + length - 1, segment);
        log.info(`Starting erase at ${addr.toString(16)} and erasing until ${endAddr.toString(16)}`);

        let bytesErased = 0;
        const bytesToErase = endAddr - addr;

        while (addr < endAddr) {
            if (segment.end <= addr) {
                segment = this.dfu.getSegment(addr);
            }
            if (!segment.erasable) {
                bytesErased = Math.min(bytesErased - segment.end - addr, bytesToErase);
                addr = segment.end;
                this.logProgress(bytesErased, bytesToErase);
                continue;
            }
            const sectorIndex = Math.floor((addr - segment.start) / segment.sectorSize);
            const sectorAddr = segment.start + sectorIndex * segment.sectorSize;
            // eslint-disable-next-line no-await-in-loop
            try {
                await this.sendDFUCommand(this.ERASE_PAGE, sectorAddr, 4);
                await this.dfu.getStatus();
            } catch (e) {
                this.emit('error', `Erase failed: ${e.message || e}`);
                return false;
            }
            addr = sectorAddr + segment.sectorSize;
            bytesErased += segment.sectorSize;
            this.logProgress(bytesErased, bytesToErase);
            log.info(`Erased ${bytesErased} of ${bytesToErase} bytes`);
            this.emit('info', `Erased ${bytesErased} of ${bytesToErase} bytes`);
        }
        log.info('Erase finished');
        return true;
    }

    async sendDFUCommand(command, param = 0x00, len = 1) {
        // Array buffer codec for command to send
        let payload = new ArrayBuffer(len + 1);
        const dv = new DataView(payload);
        dv.setUint8(0, command);

        if (len === 1) {
            dv.setUint8(1, param);
        } else if (len === 4) {
            dv.setUint32(1, param, true);
        } else {
            this.emit('error', `Invalid length of ${len} specified - must be 1 or 4`);
            return;
        }

        try {
            await this.dfu.download(payload, 0);
        } catch (err) {
            log.error(err);
            throw new Error(`Error during DFU command 0x${command.toString(16)}`);
        }

        // Poll status
        log.info('Poll status');
        let status = await this.dfu.pollUntil(state => (state !== DFU.dfuDNBUSY));
        if (status.status !== this.dfu.STATUS_OK) {
            throw new Error(`Special DfuSe command 0x${command.toString(16)} failed`);
        }
    }
}

export default DFUFlasher;
