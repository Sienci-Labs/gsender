/* eslint-disable no-bitwise  */
/* eslint-disable no-await-in-loop  */
/* eslint-disable no-return-assign */

import events from 'events';
import delay from 'server/lib/delay';
import { ByteLengthParser } from '@serialport/parser-byte-length';

export class YModem extends events.EventEmitter {
    constructor() {
        super();
        this.packetNum = 0;
        this.bytes = 0;
        this.hdr = new Uint8Array(3);
        this.payload = new Uint8Array(1024);
        this.crc = new Uint8Array(2);
        this.response = YModem.NAK;
        this.dataTransferredCallback = null;
        this.onData = null;
    }

    onDataTransferred(callback) {
        this.dataTransferredCallback = callback;
    }

    handler(data) {
        console.log(`data:>> ${data}`);
    }

    /**
     * File should look like {data: blob, name: string, size:string }
     */
    async upload(file, comms) {
        let state = 'NAK';
        const fileSize = file.size;
        let bytesRemaining = fileSize;

        this.comms = comms;
        this.comms.unpipe();


        const blob = new Blob([file.data]);
        const reader = blob.stream().getReader(); // Time to read the blob

        this.emit('start');
        await delay(1500);
        this.comms.pipe(new ByteLengthParser({ length: 1 }));
        this.comms.on('data', this.handler);
        // Turn on other writing, wait to clear - best way to handle for us?
        //this.comms.eventMode = false;
        //this.comms.purgeQueue();

        this.clearPayload();

        if (await this.transferInitialPacket(file.name, fileSize) === 'ACK') {
            while (bytesRemaining > 0 && state === 'ACK') {
                this.packetNum++;
                if (bytesRemaining < 1024) {
                    this.clearPayload();
                }

                const { value } = await reader.read();
                const chunk = value || new Uint8Array();
                this.payload.set(chunk);
                this.bytes = chunk.length;
                bytesRemaining -= this.bytes;

                if (this.dataTransferredCallback) {
                    this.dataTransferredCallback(fileSize, fileSize - bytesRemaining);
                }

                state = await this.transferPacket(this.bytes <= 128 ? 128 : 1024);
            }

            if (state === 'ACK') {
                this.hdr[0] = YModem.EOT;
                this.comms.write(this.hdr.slice(0, 1));
            }
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        /// Is this just a delay or???
        //this.comms.purgeQueue();
        //this.comms.eventMode = true;
        this.emit('complete', state === 'ACK');

        return state === 'ACK';
    }

    transferInitialPacket(fileName, fileSize) {
        const nameBytes = new TextEncoder().encode('/' + fileName);
        const sizeBytes = new TextEncoder().encode(fileSize.toString());

        console.log(nameBytes);
        console.log(sizeBytes);
        let j = 0;
        nameBytes.forEach(b => this.payload[j++] = b);
        j++;
        sizeBytes.forEach(b => this.payload[j++] = b);

        console.log(this.payload);
        this.packetNum = 0;
        return this.transferPacket(128);
    }

    async transferPacket(length) {
        let errors = 0;
        const crc16 = this.calculateCRC16(this.payload, length);

        this.hdr[0] = length === 128 ? YModem.SOH : YModem.STX;
        this.hdr[1] = this.packetNum & 0xFF;
        this.hdr[2] = this.hdr[1] ^ 0xFF;
        this.crc[0] = (crc16 >> 8) & 0xFF;
        this.crc[1] = crc16 & 0xFF;

        let state;
        do {
            state = await this.send(length);
            if (state === 'NAK') {
                errors++;
            }
        } while (state === 'NAK' && errors < 10);

        return errors < 10 ? state : 'CAN';
    }

    async send(length) {
        //this.comms.purgeQueue();
        this.comms.write(this.hdr, 'binary');
        this.comms.write(this.payload.slice(0, length));
        this.response = YModem.NAK;

        // TODO:  How do we check this, check implementation on ioSender side
        //await this.comms.waitForByte(this.packetNum === 0 ? 8000 : 2000, this.crc);
        await delay(5000);

        switch (this.response) {
        case YModem.ACK: return 'ACK';
        case YModem.NAK: return 'NAK';
        case YModem.CAN: return 'CAN';
        default: return 'NAK';
        }
    }

    calculateCRC16(buf, len) {
        let crc = 0;
        for (let i = 0; i < len; i++) {
            // eslint-disable-next-line no-bitwise
            let x = (crc >> 8) ^ buf[i];
            // eslint-disable-next-line no-bitwise
            x ^= x >> 4;
            // eslint-disable-next-line no-bitwise
            crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
        }
        return crc;
    }

    clearPayload() {
        this.payload.fill(0);
    }
}
