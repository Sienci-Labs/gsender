/* eslint-disable no-bitwise */
/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.com/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import logger from './logger';

const log = logger('YModem');

// YMODEM Protocol Constants
// const SOH = 0x01; // Start of Header (128-byte packets)
const STX = 0x02; // Start of Text (1024-byte packets)
// const EOT = 0x04; // End of Transmission
const ACK = 0x06; // Acknowledge
const NAK = 0x15; // Negative Acknowledge
const CAN = 0x18; // Cancel
const CRC = 0x43; // 'C' - CRC mode

// YMODEM Packet Types
const PACKET_TYPE_FILE_HEADER = 0x00;
const PACKET_TYPE_DATA = 0x01;
const PACKET_TYPE_END = 0x00;

class YModem extends EventEmitter {
    constructor(connection) {
        super();
        this.connection = connection;
        this.timeout = 10000; // 10 seconds timeout
        this.retries = 10;
        this.packetSize = 1024; // YMODEM uses 1024-byte packets
        this.currentFile = null;
        this.fileStream = null;
        this.fileSize = 0;
        this.bytesSent = 0;
        this.packetNumber = 0;
        this.isTransferring = false;
        this.transferTimeout = null;
    }

    /**
     * Calculate CRC16 for YMODEM
     * @param {Buffer} data - Data to calculate CRC for
     * @returns {number} - CRC16 value
     */
    calculateCRC16(data) {
        let crc = 0x0000;
        for (let i = 0; i < data.length; i++) {
            crc ^= data[i] << 8;
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc <<= 1;
                }
            }
        }
        return crc & 0xFFFF;
    }

    /**
     * Send a YMODEM packet
     * @param {number} packetType - Type of packet (0x00 for header/end, 0x01 for data)
     * @param {Buffer} data - Packet data
     * @param {string} filename - Filename (for header packet)
     * @param {number} filesize - File size (for header packet)
     */
    sendPacket(packetType, data = null, filename = '', filesize = 0) {
        const packet = Buffer.alloc(this.packetSize + 5);
        let offset = 0;

        // Packet header
        packet[offset++] = STX; // Use STX for 1024-byte packets
        packet[offset++] = this.packetNumber;
        packet[offset++] = 255 - this.packetNumber; // Complement

        if (packetType === PACKET_TYPE_FILE_HEADER) {
            // File header packet: filename + filesize + modification time
            const headerData = Buffer.alloc(128);
            let headerOffset = 0;

            // Filename
            headerData.write(filename, headerOffset);
            headerOffset += filename.length;
            headerData[headerOffset++] = 0; // Null terminator

            // File size
            headerData.write(filesize.toString(), headerOffset);
            headerOffset += filesize.toString().length;
            headerData[headerOffset++] = 0; // Null terminator

            // Modification time (Unix timestamp)
            const modTime = Math.floor(Date.now() / 1000).toString();
            headerData.write(modTime, headerOffset);
            headerOffset += modTime.length;
            headerData[headerOffset++] = 0; // Null terminator

            // Mode (permissions) - default to 0644
            headerData.write('0644', headerOffset);
            headerOffset += 4;
            headerData[headerOffset++] = 0; // Null terminator

            // Serial number (optional)
            headerData.write('0', headerOffset);
            headerOffset += 1;
            headerData[headerOffset++] = 0; // Null terminator

            // Number of links (optional)
            headerData.write('1', headerOffset);
            headerOffset += 1;
            headerData[headerOffset++] = 0; // Null terminator

            // Username (optional)
            headerData.write('gsender', headerOffset);
            headerOffset += 7;
            headerData[headerOffset++] = 0; // Null terminator

            // Group name (optional)
            headerData.write('gsender', headerOffset);
            headerOffset += 7;
            headerData[headerOffset++] = 0; // Null terminator

            // Fill remaining with zeros
            while (headerOffset < 128) {
                headerData[headerOffset++] = 0;
            }

            headerData.copy(packet, offset);
        } else if (data) {
            // Data packet
            data.copy(packet, offset);
            // Fill remaining with 0x1A (EOF)
            for (let i = offset + data.length; i < offset + this.packetSize; i++) {
                packet[i] = 0x1A;
            }
        } else {
            // End packet - fill with 0x00
            for (let i = offset; i < offset + this.packetSize; i++) {
                packet[i] = 0x00;
            }
        }

        // Calculate and append CRC
        const crc = this.calculateCRC16(packet.slice(3, 3 + this.packetSize));
        packet[offset + this.packetSize] = (crc >> 8) & 0xFF;
        packet[offset + this.packetSize + 1] = crc & 0xFF;

        // Send packet
        this.connection.write(packet);
        log.debug(`Sent packet ${this.packetNumber}, type: ${packetType}, size: ${data ? data.length : 0}`);
    }

    /**
     * Wait for acknowledgment from receiver
     * @returns {Promise<boolean>} - True if ACK received, false if NAK/CAN
     */
    waitForAck() {
        return new Promise((resolve, reject) => {
            let retries = 0;
            const maxRetries = this.retries;

            const timeout = setTimeout(() => {
                this.connection.removeListener('data', dataHandler);
                reject(new Error('Timeout waiting for acknowledgment'));
            }, this.timeout);

            const dataHandler = (data) => {
                const response = data.toString();

                if (response.includes('C') || response.includes(String.fromCharCode(CRC))) {
                    // Receiver requesting CRC mode
                    clearTimeout(timeout);
                    this.connection.removeListener('data', dataHandler);
                    resolve(true);
                } else if (response.includes(String.fromCharCode(ACK))) {
                    // Acknowledgment received
                    clearTimeout(timeout);
                    this.connection.removeListener('data', dataHandler);
                    resolve(true);
                } else if (response.includes(String.fromCharCode(NAK))) {
                    // Negative acknowledgment
                    retries++;
                    if (retries >= maxRetries) {
                        clearTimeout(timeout);
                        this.connection.removeListener('data', dataHandler);
                        reject(new Error('Too many NAKs received'));
                    }
                    // Resend packet
                    this.resendLastPacket();
                } else if (response.includes(String.fromCharCode(CAN))) {
                    // Transfer cancelled
                    clearTimeout(timeout);
                    this.connection.removeListener('data', dataHandler);
                    reject(new Error('Transfer cancelled by receiver'));
                }
            };

            this.connection.on('data', dataHandler);
        });
    }

    /**
     * Resend the last packet (called when NAK received)
     */
    resendLastPacket() {
        if (this.currentFile && this.fileStream) {
            const chunk = this.fileStream.read(this.packetSize);
            if (chunk) {
                this.sendPacket(PACKET_TYPE_DATA, chunk);
            }
        }
    }

    /**
     * Send a file using YMODEM protocol
     * @param {string} filePath - Path to the file to send
     * @param {string} remoteFilename - Filename on the remote device
     * @returns {Promise<void>}
     */
    async sendFile(filePath, remoteFilename = null) {
        if (this.isTransferring) {
            throw new Error('Transfer already in progress');
        }

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const stats = fs.statSync(filePath);
        const filename = remoteFilename || path.basename(filePath);

        this.currentFile = {
            path: filePath,
            name: filename,
            size: stats.size
        };

        this.fileSize = stats.size;
        this.bytesSent = 0;
        this.packetNumber = 0;
        this.isTransferring = true;

        try {
            this.fileStream = fs.createReadStream(filePath);

            // Wait for 'C' to start transfer
            log.info('Waiting for receiver to initiate transfer...');
            await this.waitForAck();

            // Send file header packet
            this.packetNumber = 0;
            this.sendPacket(PACKET_TYPE_FILE_HEADER, null, filename, this.fileSize);

            const headerAck = await this.waitForAck();
            if (!headerAck) {
                throw new Error('Failed to send file header');
            }

            this.packetNumber = 1;
            this.emit('transfer:start', { filename, size: this.fileSize });

            // Send file data
            return new Promise((resolve, reject) => {
                this.fileStream.on('data', async (chunk) => {
                    try {
                        this.sendPacket(PACKET_TYPE_DATA, chunk);
                        this.bytesSent += chunk.length;

                        // Emit progress
                        const progress = (this.bytesSent / this.fileSize) * 100;
                        this.emit('transfer:progress', {
                            bytesSent: this.bytesSent,
                            totalBytes: this.fileSize,
                            progress
                        });

                        await this.waitForAck();
                        this.packetNumber++;
                    } catch (error) {
                        reject(error);
                    }
                });

                this.fileStream.on('end', async () => {
                    try {
                        // Send end packet
                        this.sendPacket(PACKET_TYPE_END);
                        await this.waitForAck();

                        this.emit('transfer:complete', {
                            filename,
                            size: this.fileSize,
                            bytesSent: this.bytesSent
                        });
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });

                this.fileStream.on('error', (error) => {
                    reject(error);
                });
            });
        } finally {
            this.cleanup();
        }
    }

    /**
     * Send multiple files using YMODEM protocol
     * @param {Array<string>} filePaths - Array of file paths to send
     * @param {Array<string>} remoteFilenames - Array of remote filenames (optional)
     * @returns {Promise<void>}
     */
    async sendFiles(filePaths, remoteFilenames = []) {
        for (let i = 0; i < filePaths.length; i++) {
            const filePath = filePaths[i];
            const remoteFilename = remoteFilenames[i] || null;

            try {
                // eslint-disable-next-line no-await-in-loop
                await this.sendFile(filePath, remoteFilename);
                this.emit('transfer:fileComplete', {
                    filePath,
                    remoteFilename: remoteFilename || path.basename(filePath)
                });
            } catch (error) {
                this.emit('transfer:error', { filePath, error: error.message });
                throw error;
            }
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.isTransferring = false;
        this.currentFile = null;
        this.fileSize = 0;
        this.bytesSent = 0;
        this.packetNumber = 0;

        if (this.fileStream) {
            this.fileStream.destroy();
            this.fileStream = null;
        }

        if (this.transferTimeout) {
            clearTimeout(this.transferTimeout);
            this.transferTimeout = null;
        }
    }

    /**
     * Cancel current transfer
     */
    cancel() {
        if (this.isTransferring) {
            this.connection.write(Buffer.from([CAN, CAN]));
            this.cleanup();
            this.emit('transfer:cancelled');
        }
    }
}

export default YModem;
