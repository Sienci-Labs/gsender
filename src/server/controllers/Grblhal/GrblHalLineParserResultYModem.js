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

class GrblHalLineParserResultYModem {
    static parse(line) {
        // YMODEM protocol responses
        // Match various YMODEM-related patterns from GRBLHAL

        // YMODEM transfer start/ready
        const ymodemReady = line.match(/YMODEM:READY/i);
        if (ymodemReady) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'ready',
                    raw: line
                }
            };
        }

        // YMODEM transfer progress
        const ymodemProgress = line.match(/YMODEM:PROGRESS:(\d+)\/(\d+)/i);
        if (ymodemProgress) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'progress',
                    current: parseInt(ymodemProgress[1], 10),
                    total: parseInt(ymodemProgress[2], 10),
                    raw: line
                }
            };
        }

        // YMODEM transfer complete
        const ymodemComplete = line.match(/YMODEM:COMPLETE/i);
        if (ymodemComplete) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'complete',
                    raw: line
                }
            };
        }

        // YMODEM transfer error
        const ymodemError = line.match(/YMODEM:ERROR:(.+)/i);
        if (ymodemError) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'error',
                    error: ymodemError[1].trim(),
                    raw: line
                }
            };
        }

        // YMODEM file received
        const ymodemFileReceived = line.match(/YMODEM:FILE:([^|]+)\|SIZE:(\d+)/i);
        if (ymodemFileReceived) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'file_received',
                    filename: ymodemFileReceived[1].trim(),
                    size: parseInt(ymodemFileReceived[2], 10),
                    raw: line
                }
            };
        }

        // YMODEM transfer cancelled
        const ymodemCancelled = line.match(/YMODEM:CANCELLED/i);
        if (ymodemCancelled) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'cancelled',
                    raw: line
                }
            };
        }

        // YMODEM timeout
        const ymodemTimeout = line.match(/YMODEM:TIMEOUT/i);
        if (ymodemTimeout) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'timeout',
                    raw: line
                }
            };
        }

        // YMODEM CRC error
        const ymodemCrcError = line.match(/YMODEM:CRC_ERROR/i);
        if (ymodemCrcError) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'crc_error',
                    raw: line
                }
            };
        }

        // YMODEM packet error
        const ymodemPacketError = line.match(/YMODEM:PACKET_ERROR:(\d+)/i);
        if (ymodemPacketError) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'packet_error',
                    packetNumber: parseInt(ymodemPacketError[1], 10),
                    raw: line
                }
            };
        }

        // YMODEM storage full
        const ymodemStorageFull = line.match(/YMODEM:STORAGE_FULL/i);
        if (ymodemStorageFull) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'storage_full',
                    raw: line
                }
            };
        }

        // YMODEM file exists (overwrite prompt)
        const ymodemFileExists = line.match(/YMODEM:FILE_EXISTS:([^|]+)/i);
        if (ymodemFileExists) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'file_exists',
                    filename: ymodemFileExists[1].trim(),
                    raw: line
                }
            };
        }

        // YMODEM invalid filename
        const ymodemInvalidFilename = line.match(/YMODEM:INVALID_FILENAME/i);
        if (ymodemInvalidFilename) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'invalid_filename',
                    raw: line
                }
            };
        }

        // YMODEM unsupported file type
        const ymodemUnsupportedType = line.match(/YMODEM:UNSUPPORTED_TYPE/i);
        if (ymodemUnsupportedType) {
            return {
                type: GrblHalLineParserResultYModem,
                payload: {
                    type: 'unsupported_type',
                    raw: line
                }
            };
        }

        return null;
    }
}

export default GrblHalLineParserResultYModem;
