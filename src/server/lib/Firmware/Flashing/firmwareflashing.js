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

import AvrgirlArduino from 'avrgirl-arduino';
import mk1Image from '!file-loader!./mk1_20220214.hex';
import mk2Image from '!file-loader!./mk2_20220214.hex';
import logger from '../../logger';
import store from '../../../store';

const log = logger('FlashLib: ');
const FlashingFirmware = (recievedPortNumber, imageType = 'MK1') => {
    if (!recievedPortNumber) {
        log.error('No port specified');
        return;
    }
    console.log(imageType);
    const controller = store.get('controllers["' + recievedPortNumber + '"]');
    try {
        let avrgirl = new AvrgirlArduino({
            board: 'uno',
            port: recievedPortNumber,
        });
        let imageHex = (imageType === 'MK2') ? mk2Image : mk1Image;
        avrgirl.flash(imageHex, (error) => {
            if (error) {
                if (controller) {
                    controller.command('flashing:failed', error);
                }
                log.debug(`${error} Error flashing board`);
            } else {
                if (controller) {
                    controller.command('flashing:success');
                }
                log.debug('Flash successful');
            }
        });
    } catch (error) {
        log.debug(`${error} Error flashing board`);
    }
};


export default FlashingFirmware;
