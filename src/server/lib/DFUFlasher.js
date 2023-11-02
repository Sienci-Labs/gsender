import fs from 'fs';
import intelhex from 'intel-hex';

const VALID_VENDOR_IDS = [0x0483];
const VALID_DEVICE_ID = [0x441];

const START_ADDRESS = 0x08000000;

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
    constructor({ port, ...options }) {
        this.port = port;
        this.options = options;
    }

    flash(file) {
        const data = this.parseHex(file);
        console.log(data);
    }

    /**
     * Returns parsed data from either string path or file blob
     * @param file
     * @returns {Buffer|*}
     */
    parseHex(file) {
        try {
            let data = null;
            if (typeof data === 'string') {
                data = fs.readFileSync(file, {
                    encoding: 'utf8'
                });
            } else {
                data = Buffer.from(file);
            }
            return intelhex.parse(data).data;
        } catch (err) {
            return err;
        };
    }

    /**
     * Return buffer from string of hex characters
     * @param line string hex value
     * @returns {Buffer}
     */
    hexStringToByte(line) {
        return Buffer.from([parseInt(line, 16)]);
    }

    static get SET_ADDRESS() {
        return 0x21;
    }

    static get ERASE_SECTOR() {
        return 0x41;
    }

    static get READ_UNPROTECT() {
        return 0x92;
    }

    static get GET_COMMANDS() {
        return 0x00;
    }
}

export default DFUFlasher;
