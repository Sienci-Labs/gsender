import AvrgirlArduino from 'avrgirl-arduino';
import hex from '!file-loader!./grbl1.1h.hex';
import logger from '../../logger';
import store from '../../../store';

const log = logger('FlashLib: ');
const FlashingFirmware = (recievedPortNumber) => {
    const controller = store.get('controllers["' + recievedPortNumber + '"]');
    try {
        let avrgirl = new AvrgirlArduino({
            board: 'uno',
            debug: true,
            port: recievedPortNumber,
        });

        avrgirl.flash(hex, error => {
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
    }
};


export default FlashingFirmware;
