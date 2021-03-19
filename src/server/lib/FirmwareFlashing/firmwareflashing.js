/* eslint-disable no-unused-vars */
import AvrgirlArduino from 'avrgirl-arduino';
import logger from '../logger';
import store from '../../store';

const log = logger('FlashLib: ');
const FlashingFirmware = (recievedPortNumber) => {
    const controller = store.get('controllers["' + recievedPortNumber + '"]');

    try {
        let avrgirl = new AvrgirlArduino({
            board: 'uno',
            debug: true,
            port: recievedPortNumber,
        });

        // avrgirl.list((error, ports) => {
        //     if (error) {
        //         controller.command('flashing:failed', error);
        //         log.debug(`${error} Error flashing board`);
        //     } else {
        //         log.debug(JSON.stringify(ports[0].path));
        //         let port = ports[0].path;
        //     }
        // });

        // avrgirl.flash('../../BLANK HEX TO TEST.hex', error => {
        avrgirl.flash('../../filetoflashuno.hex', error => {
            if (error) {
                controller.command('flashing:failed', error);
                log.debug(`${error} Error flashing board`);
            } else {
                log.debug('FLASH SUCCESFULL!!!');
                controller.command('flashing:success');
            }
        });
    } catch (error) {
        controller.command('flashing:failed', error);
        log.debug(`${error} Error flashing board -CATCH`);
    }
};


export default FlashingFirmware;
