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
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import AvrgirlArduino from '@sienci/avrgirl-arduino';
import mk1Image from '!file-loader!./mk1_20220214.hex';
import mk2Image from '!file-loader!./mk2_20220214.hex';
import logger from '../../logger';

const log = logger('FlashLib: ');
const FlashingFirmware = (flashPort, imageType = 'MK1', socket) => {
    if (!flashPort) {
        log.error('No port specified');
        return;
    }

    try {
        let avrgirl = new AvrgirlArduino({
            board: 'uno',
            port: flashPort,
        });

        let imageHex = (imageType === 'MK2') ? mk2Image : mk1Image;
        socket.emit('flash:message', { type: 'Info', content: `Starting Arduino flash on port ${flashPort}.` });
        avrgirl.flash(imageHex, (error) => {
            if (error) {
                socket.emit('task:error', error);
                log.debug(`${error} Error flashing board`);
            } else {
                socket.emit('flash:end', flashPort);
                log.debug('Flash successful');
            }
        });
    } catch (error) {
        const message = 'An error occurred while flashing';
        log.debug(`${error} ${message}`);
        socket.emit('task:error', message);
    }
};


export default FlashingFirmware;
