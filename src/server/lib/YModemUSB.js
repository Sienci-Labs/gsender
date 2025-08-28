import * as events from 'events';
import { ByteLengthParser } from '@serialport/parser-byte-length';
import { CRC } from 'crc-full';

const SendSize = {
    0x01: 128,
    0x02: 1024,
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


const DebugDict = {
    0x01: 'SOH',
    0x02: 'STX',
    0x04: 'EOT',
    0x06: 'ACK',
    0x15: 'NAL',
    0x18: 'CAN',
    0x43: 'C',
    0x1a: 'PADDING',
};


export class YModem extends events.EventEmitter {
    SOH = 0x01;

    STX = 0x02;

    EOT = 0x04;

    ACK = 0x06;

    NAK = 0x15;

    CAN = 0x18;

    C = 'C'.charCodeAt(0);

    PAD_CHAR = 0x1a;

    crcCalc = new CRC('CRC16_XMODEM', 16, 0x1021, 0x0000, 0x0000, false, false);

    constructor() {
        super();
        this.comms = null;
        this.ByteReader = new ByteLengthParser({ length: 1 });
        this.logger = console.log;
    }

    async sendFile(fileData, comms, progressCB) {
        this.comms = comms;
        this.emit('start');
        await sleep(500);
        // Drop line reader, use byte reader
        this.comms.unpipe();
        this.comms.pipe(this.ByteReader);

        this.logger('Sending file...');

        await this.waitForNext([this.C]);

        console.log('C received');
        const header = this.createHeaderPacket(this.SOH, fileData.name, fileData.data.byteLength);
        this.comms.write(header);
        this.logger('First Packet');
        // [<<< ACK]
        await this.waitForNext([YModem.ACK]);
        // [<<< C]
        await this.waitForNext([YModem.C]);

        console.log('header written');
    }

    waitForNext(controlChars) {
        return new Promise<number>((resolve) => {
            this.onControlCharsRead(controlChars, resolve);
        });
    }

    onControlCharsRead(controlChars, callback) {
        this.ByteReader.on('data', function onCharRead(newData) {
            const newChar = newData[0];
            if (controlChars.includes(newChar)) {
                this.logger(`[<<< ${DebugDict[newChar]}]`);
                this.ByteReader.removeListener('data', onCharRead);
                callback(newChar);
            }
        }.bind(this));
    }

    createHeaderPacket(sendType, fileName, fileSize) {
        const chosenSendSize = SendSize[sendType];

        // Check if file size exceeds maximum allowed for transmission
        if (0xff - 0x01 * chosenSendSize > fileSize) {
            throw new Error('Couldn\'t send file. File is too big.');
        }

        const strFileSize = fileSize.toString();

        // Check if combined length of filename and filesize exceeds packet size
        if (fileName.length + strFileSize.length > chosenSendSize - 1) {
            throw new Error(
                'Couldn\'t send file. Either filename is too big or the file is extremely large.'
            );
        }

        const bufferSize = chosenSendSize + 5;
        const headerPacket = Buffer.alloc(bufferSize);
        let currentBufferLoc = 0;

        // Write header fields
        headerPacket.writeUInt8(sendType, currentBufferLoc++);
        headerPacket.writeUInt8(0x00, currentBufferLoc++); // seq
        headerPacket.writeUInt8(0xff, currentBufferLoc++); // seqOc

        // Write filename
        headerPacket.write(fileName, currentBufferLoc);
        currentBufferLoc += fileName.length;
        headerPacket.writeUInt8(0x00, currentBufferLoc++); // separator

        // Write file size
        headerPacket.write(strFileSize, currentBufferLoc);
        currentBufferLoc += strFileSize.length;
        headerPacket.writeUInt8(0x00, currentBufferLoc++); // separator

        // Calculate CRC
        const dataFrame = Buffer.from(
            headerPacket.buffer.slice(3, 3 + chosenSendSize)
        );
        const dataCrc = this.calculateCRC(dataFrame);

        // Write CRC
        headerPacket.writeUInt16BE(dataCrc, bufferSize - 2);

        return headerPacket;
    }

    calculateCRC(data) {
        return this.crcCalc.compute(data);
    }
}
