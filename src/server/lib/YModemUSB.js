import * as events from 'events';
import { ByteLengthParser } from '@serialport/parser-byte-length';
import { ReadlineParser } from '@serialport/parser-readline';
import { CRC } from 'crc-full';
import bufferChunks from 'buffer-chunks';
import logger from 'server/lib/logger';
import debugLog from './debugLog';

const log = logger('lib:ymodem');

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
        try {
            await this.waitForNextWithTimeout([this.C, this.ACK, this.NAK], 3000);
        } catch (e) {
            this.emit('error', e.message);
            throw e;
        }


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

        let sendType = fileChunks.length === 1 && isLastByteSOH ? this.SOH : this.STX;
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
                dataPacket
            );

            this.sentPackets = packetNo;
            const progress = Math.ceil((packetNo / fileChunks.length) * 100);
            this.emit('progress', progress);
        }

        log.info('sendFile: finished sending all packets');

        // [>>> EOT]
        this.comms.write([this.EOT]);
        log.info('sendFile: [>>> EOT] sent');
        this.comms.removeAllListeners('data');
        await sleep(100);
        this.comms.unpipe();
        this.comms.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.emit('complete');
    }

    async sendFiles(files, comms) {
        log.info(`sendFiles: starting transfer of ${files.length} file(s)`);
        debugLog(`sendFiles: starting transfer of ${files.length} file(s)`);
        this.comms = comms;
        this.emit('start');
        await sleep(500);
        // Drop line reader, use byte reader
        this.comms.unpipe();
        this.comms.removeAllListeners('data');
        this.comms.pipe(this.ByteReader);

        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
            const fileData = files[fileIndex];
            // Empty file - add blank buffer
            if (!fileData.data) {
                fileData.data = Buffer.alloc(0);
            } else if (!Buffer.isBuffer(fileData.data)) {
                if (typeof fileData.content === 'string') {
                    debugLog(`sendFiles: converting content string to Buffer for "${fileData.name}"`);
                    fileData.data = Buffer.from(fileData.content, 'utf8');
                } else if (typeof fileData.data === 'string') {
                    debugLog(`sendFiles: converting data string to Buffer for "${fileData.name}"`);
                    fileData.data = Buffer.from(fileData.data, 'utf8');
                } else {
                    debugLog(`sendFiles: data is unexpected type ${fileData.data?.constructor?.name} for "${fileData.name}", converting`);
                    fileData.data = Buffer.from(fileData.data);
                }
                fileData.size = fileData.data.byteLength;
            }

            log.info(`sendFiles: [${fileIndex + 1}/${files.length}] starting "${fileData.name}" (${fileData.data.byteLength} bytes)`);
            debugLog(`sendFiles: [${fileIndex + 1}/${files.length}] starting "${fileData.name}" (${fileData.data.byteLength} bytes)`);

            const header = this.createHeaderPacket(this.SOH, fileData.name, fileData.data.byteLength);
            this.comms.write(header);

            // [<<< C]

            try {
                // eslint-disable-next-line no-await-in-loop
                await this.waitForNextWithTimeout([this.C, this.ACK, this.NAK], 5000);
                log.info(`sendFiles: header ACK/C received for "${fileData.name}"`);
                debugLog(`sendFiles: header ACK/C received for "${fileData.name}"`);
            } catch (e) {
                log.error(`sendFiles: timeout/error waiting for header ACK on "${fileData.name}": ${e.message}`);
                debugLog(`sendFiles: timeout/error waiting for header ACK on "${fileData.name}": ${e.message}`);
                this.emit('error', e.message);
                throw e;
            }


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

            let sendType = fileChunks.length === 1 && isLastByteSOH ? this.SOH : this.STX;
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
                    dataPacket
                );

                this.sentPackets = packetNo;
                const progress = Math.ceil((packetNo / fileChunks.length) * 100);
                this.emit('progress', progress);
            }

            log.info(`sendFiles: [${fileIndex + 1}/${files.length}] all packets sent for "${fileData.name}"`);
            debugLog(`sendFiles: [${fileIndex + 1}/${files.length}] all packets sent for "${fileData.name}"`);

            // [>>> EOT]
            this.comms.write([this.EOT]);
            log.info(`sendFiles: [>>> EOT] sent for file "${fileData.name}"`);
            debugLog(`sendFiles: [>>> EOT] sent for file "${fileData.name}"`);

            // eslint-disable-next-line no-await-in-loop
            await sleep(200);
        }

        log.info('sendFiles: finished sending all files');
        debugLog('sendFiles: finished sending all files');


        this.comms.removeAllListeners('data');
        await sleep(100);
        this.comms.unpipe();
        this.comms.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.emit('complete');
    }

    waitForNext(controlChars) {
        let cancel;
        const promise = new Promise((resolve) => {
            cancel = this.onControlCharsRead(controlChars, resolve);
        });
        promise.cancel = cancel;
        return promise;
    }

    onControlCharsRead(controlChars, callback) {
        const bound = function onCharRead(newData) {
            const newChar = newData[0];
            if (controlChars.includes(newChar)) {
                log.debug(`[<<< ${DebugDict[newChar]}]`);
                if (newChar === this.NAK) {
                    log.debug('NAK received during control char read');
                }
                this.comms.removeListener('data', bound);
                callback(newChar);
            }
        }.bind(this);
        this.comms.on('data', bound);
        return () => this.comms.removeListener('data', bound);
    }

    async sendDataPacket(packetNo, dataPacket) {
        log.debug(`Sending frame: ${packetNo}`);

        for (let retryCount = 1; retryCount <= 10; retryCount++) {
            // Create a fresh listener for each attempt
            const waitForCCs = this.waitForNext([
                this.ACK,
                this.NAK,
                this.CAN,
            ]);

            this.comms.write(dataPacket);

            const timeout = sleep(3000);
            // eslint-disable-next-line no-await-in-loop
            const result = await Promise.race([waitForCCs, timeout]);
            // Cancel the pending listener if timeout fired (result is undefined)
            // eslint-disable-next-line no-unused-expressions
            waitForCCs.cancel?.();

            log.debug(`Frame ${packetNo} response: ${DebugDict[result] ?? result}`);
            if (result === this.ACK) {
                break;
            } else if (result === this.NAK) {
                retryCount -= 1;
                log.warn(`NAK received for frame ${packetNo}, retransmitting`);
                debugLog(`NAK received for frame ${packetNo}, retransmitting`);
            } else if (result === this.CAN) {
                log.warn(`CAN received on frame ${packetNo}, aborting`);
                debugLog(`CAN received on frame ${packetNo}, aborting`);
                this.emit('error', 'Operation cancelled by remote device.');
                throw new Error('Operation cancelled by remote device.');
            } else {
                log.debug(`Frame ${packetNo} timeout/no-ack, retry ${retryCount}`);
            }

            if (retryCount >= 3) {
                this.emit('error', 'Packet timed out after 3 retries.');
                throw new Error(
                    `Packet timed out after ${retryCount} retries.`
                );
            }
        }
    }

    waitForNextWithTimeout(controlChars, timeoutMs = 10000) {
        let timeoutHandle;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                reject(new Error(`Timeout waiting for control characters: ${controlChars.map(c => DebugDict[c] || c).join(', ')}`));
            }, timeoutMs);
        });

        return Promise.race([
            this.waitForNext(controlChars),
            timeoutPromise
        ]).finally(() => {
            clearTimeout(timeoutHandle);
        });
    }


    createHeaderPacket(sendType, fileName, fileSize) {
        fileName = `/${fileName}`;
        const chosenSendSize = SendSize[sendType];
        log.info(`createHeaderPacket: file="${fileName}" size=${fileSize}`);

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

    splitFileToChunks(buf, chunkSize) {
        const chunks = bufferChunks(buf, chunkSize);
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
        return length === current;
    }


    calculateCRC(data) {
        return this.crcCalc.compute(data);
    }
}
