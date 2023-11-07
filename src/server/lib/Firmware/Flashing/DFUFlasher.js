
import fs from 'fs';
import DFU from './DFU';
import MemoryMap from 'nrf-intel-hex';
//import slbHex from '!file-loader!./slb_orange.hex';


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


class DFUFlasher {
    static VENDOR_ID = 0x0483;

    constructor({ port, ...options }) {
        this.path = port;
        this.options = options;
        this.dfu = new DFU(this.path, options);
    }

    flash() {
        this.dfu.open();
        //const map = this.parseHex(slbHex);
        //console.log(map.length);
        /*        if (map) {
                    for (let [address, dataBlock] of map) {
                        console.log('Data block at ', address.toString(16), ', bytes: ', dataBlock);
                    }
                }*/
    }

    /**
     * Returns parsed data from either string path or file blob
     * @param file
     * @returns {Buffer|*}
     */
    parseHex(file) {
        try {
            let data = null;
            data = fs.readFileSync(file, {
                encoding: 'utf8'
            });
            return MemoryMap.fromHex(data);
        } catch (err) {
            throw err;
        }
    }

    async downloadBlock(data, size, manifestTolerant) {
        // Erase Segment

        // while bytes_sent < size
        // Copy data
        // set address DFUSE
        // write chunk
        // poll until idle
        // address += chunk_size


        // check manifest
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
            throw new Error(`Invalid length of ${len} specified - must be 1 or 4`);
        }

        try {
            await this.download(payload, 0);
        } catch (err) {
            throw new Error(`Error during DFU command ${command}`);
        }

        // Poll status
        let status = await this.pollUntil(state => (state !== DFU.dfuDNBUSY));
        if (status.status !== DFU.STATUS_OK) {
            throw new Error('Special DfuSe command ' + command + ' failed');
        }
    }


    //async pollUntil() {}

    //async download(payload, offset)  {}

    /**
     * Return buffer from string of hex characters
     * @param line string hex value
     * @returns {Buffer}
     */
    hexStringToByte(line) {
        return Buffer.from([parseInt(line, 16)]);
    }
}

export default DFUFlasher;
