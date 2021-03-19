/* eslint-disable no-unused-vars */
import AvrgirlArduino from 'avrgirl-arduino';
import logger from '../logger';
import store from '../../store';

const log = logger('FlashLib: ');
const FlashingFirmware = (recievedPortNumber, connectionFunction) => {
    const controller = store.get('controllers["' + recievedPortNumber + '"]');

    try {
        let avrgirl = new AvrgirlArduino({
            board: 'uno',
            debug: true,
            port: recievedPortNumber,
        });

        avrgirl.list((err, ports) => {
            log.debug(JSON.stringify(ports[0].path));
            let port = ports[0].path;
        });

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
        log.debug(`${error} Error flashing board`);
        controller.command('flashing:failed', error);
    }
};


export default FlashingFirmware;
