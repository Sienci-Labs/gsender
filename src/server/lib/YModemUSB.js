import * as events from 'events';
import { ByteLengthParser } from '@serialport/parser-byte-length';
import { ReadlineParser } from '@serialport/parser-readline';
import { CRC } from 'crc-full';
import bufferChunks from 'buffer-chunks';

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
    0x15: 'NAK',
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
        this.comms.removeAllListeners('data');
        this.comms.pipe(this.ByteReader);

        // Empty file - add blank buffer
        if (!fileData.data) {
            fileData.data = Buffer.alloc(0);
        }

        const header = this.createHeaderPacket(this.SOH, fileData.name, fileData.data.byteLength);
        this.comms.write(header);

        // [<<< C]
        await this.waitForNext([this.C, this.ACK]);


        let fileChunks;
        let isLastByteSOH = false;

        if (fileData.size === 0) {
            fileChunks = [];
        } else if (fileData.size <= SendSize[this.SOH]) {
            fileChunks = [
                this.padRBuffer(
                    fileData.data,
                    SendSize[this.SOH],
                    this.PAD_CHAR
                ),
            ];
            isLastByteSOH = true;
        } else if (fileData.size <= SendSize[this.STX]) {
            fileChunks = [
                this.padRBuffer(
                    fileData.data,
                    SendSize[this.STX],
                    this.PAD_CHAR
                ),
            ];
            isLastByteSOH = false;
        } else {
            const fileSplit = this.splitFileToChunks(
                fileData.data,
                SendSize[this.STX]
            );
            fileChunks = fileSplit.chunks;
            isLastByteSOH = fileSplit.isLastByteSOH;
        }

        let sendType = this.STX;
        this.totalPackets = fileChunks.length;

        for (let packetNo = 1; packetNo <= fileChunks.length; packetNo++) {
            if (this.isLast(fileChunks.length, packetNo)) {
                sendType = isLastByteSOH ? this.SOH : this.STX;
            }

            const fileChunk = fileChunks[packetNo - 1];

            const dataPacket = this.createDataPacket(
                sendType,
                packetNo % 256,
                fileChunk
            );

            // eslint-disable-next-line no-await-in-loop
            await this.sendDataPacket(
                packetNo,
                dataPacket,
                50
            );

            this.sentPackets = packetNo;
            const progress = Math.ceil((packetNo / fileChunks.length) * 100);
            this.emit('progress', progress);
        }

        this.logger('Finished sending packets');

        // [>>> EOT]
        this.comms.write([this.EOT]);
        this.logger('[>>> EOT]');
        this.comms.removeAllListeners('data');
        await sleep(100);
        this.comms.unpipe();
        this.comms.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.emit('complete');
    }

    async sendFiles(files, comms) {
        this.comms = comms;
        this.emit('start');
        await sleep(500);
        // Drop line reader, use byte reader
        this.comms.unpipe();
        this.comms.removeAllListeners('data');
        this.comms.pipe(this.ByteReader);


        for (const fileData of files) {
            // Empty file - add blank buffer
            if (!fileData.data) {
                fileData.data = Buffer.alloc(0);
            }

            const header = this.createHeaderPacket(this.SOH, fileData.name, fileData.data.byteLength);
            this.comms.write(header);

            // [<<< C]
            // eslint-disable-next-line no-await-in-loop
            await this.waitForNext([this.C, this.ACK]);


            let fileChunks;
            let isLastByteSOH = false;

            if (fileData.size === 0) {
                fileChunks = [];
            } else if (fileData.size <= SendSize[this.SOH]) {
                fileChunks = [
                    this.padRBuffer(
                        fileData.data,
                        SendSize[this.SOH],
                        this.PAD_CHAR
                    ),
                ];
                isLastByteSOH = true;
            } else if (fileData.size <= SendSize[this.STX]) {
                fileChunks = [
                    this.padRBuffer(
                        fileData.data,
                        SendSize[this.STX],
                        this.PAD_CHAR
                    ),
                ];
                isLastByteSOH = false;
            } else {
                const fileSplit = this.splitFileToChunks(
                    fileData.data,
                    SendSize[this.STX]
                );
                fileChunks = fileSplit.chunks;
                isLastByteSOH = fileSplit.isLastByteSOH;
            }

            let sendType = this.STX;
            this.totalPackets = fileChunks.length;

            for (let packetNo = 1; packetNo <= fileChunks.length; packetNo++) {
                if (this.isLast(fileChunks.length, packetNo)) {
                    sendType = isLastByteSOH ? this.SOH : this.STX;
                }

                const fileChunk = fileChunks[packetNo - 1];

                const dataPacket = this.createDataPacket(
                    sendType,
                    packetNo % 256,
                    fileChunk
                );

                // eslint-disable-next-line no-await-in-loop
                await this.sendDataPacket(
                    packetNo,
                    dataPacket,
                    50
                );

                this.sentPackets = packetNo;
                const progress = Math.ceil((packetNo / fileChunks.length) * 100);
                this.emit('progress', progress);
            }

            // [>>> EOT]
            this.comms.write([this.EOT]);
            this.logger('[>>> EOT]');
        }

        this.logger('Finished sending packets');


        this.comms.removeAllListeners('data');
        await sleep(100);
        this.comms.unpipe();
        this.comms.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.emit('complete');
    }

    waitForNext(controlChars) {
        return new Promise((resolve) => {
            this.onControlCharsRead(controlChars, resolve);
        });
    }

    onControlCharsRead(controlChars, callback) {
        this.comms.on('data', function onCharRead(newData) {
            const newChar = newData[0];
            console.log('[<<<', newChar);
            if (controlChars.includes(newChar)) {
                this.logger(`[<<< ${DebugDict[newChar]}]`);
                this.comms.removeListener('data', onCharRead);
                callback(newChar);
            }
        }.bind(this));
    }

    async sendDataPacket(packetNo, dataPacket, sendDelay) {
        this.logger(`Sending frame: ${packetNo}.`);

        const waitForCCs = this.waitForNext([
            this.ACK,
            this.NAK,
            this.CAN,
        ]);

        for (let retryCount = 1; retryCount <= 10; retryCount++) {
            this.comms.write(dataPacket);

            this.logger(sendDelay);
            const timeout = sleep(sendDelay);
            // eslint-disable-next-line no-await-in-loop
            const result = await Promise.race([waitForCCs, timeout]);

            if (result === this.ACK) {
                break;
            }
            if (result === this.NAK) {
                retryCount -= 1;
            }
            if (result === this.CAN) {
                this.logger(`Throw on data frame ${packetNo + 1}.`);
                this.emit('error', 'Operation cancelled by remote device.');
                throw new Error('Operation cancelled by remote device.');
            } else {
                this.logger(
                    `Packet was not sent! Retrying... Retry No: ${retryCount}.`
                );
            }

            if (retryCount >= 9) {
                this.emit('error', 'Packet timed out after 10 retries.');
                throw new Error(
                    `Packet timed out after ${retryCount} retries.`
                );
            }
        }
    }


    createHeaderPacket(sendType, fileName, fileSize) {
        fileName = `/${fileName}`;
        const chosenSendSize = SendSize[sendType];
        console.log(`File: ${fileName} Size: ${fileSize} chosenSendSize: ${chosenSendSize}`);


        // Check if file size exceeds maximum allowed for transmission
        if (fileSize !== 0 && 0xff - 0x01 * chosenSendSize > fileSize) {
            this.emit('error', 'File size too big');
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
        console.log('headerPacket', headerPacket);
        return headerPacket;
    }

    splitFileToChunks(buf, chunkSize) {
        const chunks = bufferChunks(buf, chunkSize);
        console.log('chunk', chunks);
        const lastChunk = chunks[chunks.length - 1];

        let isLastByteSOH = false;

        if (lastChunk.buffer.byteLength <= SendSize[this.SOH]) {
            chunks[chunks.length - 1] = this.padRBuffer(
                lastChunk,
                SendSize[this.SOH],
                0x00
            );
            isLastByteSOH = true;
        } else {
            chunks[chunks.length - 1] = this.padRBuffer(
                lastChunk,
                SendSize[this.STX],
                0x00
            );
        }

        return { chunks, isLastByteSOH };
    }


    createDataPacket(sendType, seq, fileData) {
        const chosenSendSize = SendSize[sendType];
        const bufferSize = chosenSendSize + 5;
        const dataPacket = Buffer.alloc(bufferSize);

        dataPacket.writeUInt8(sendType, 0);
        dataPacket.writeUInt8(seq, 1);
        const seqOc = 0xff - seq;
        dataPacket.writeUInt8(seqOc, 2);

        fileData.copy(dataPacket, 3);

        const dataCrc = this.calculateCRC(fileData);
        dataPacket.writeUInt16BE(dataCrc, bufferSize - 2);

        return dataPacket;
    }

    padRBuffer(buf, desiredLength, padChar = 0x00) {
        const padBuf = Buffer.alloc(desiredLength).fill(padChar);
        buf.copy(padBuf);

        return padBuf;
    }

    isLast(length, current) {
        return length - 1 === current;
    }


    calculateCRC(data) {
        return this.crcCalc.compute(data);
    }
}
