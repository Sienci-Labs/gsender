import AvrgirlArduino from 'avrgirl-arduino';
import logger from '../logger';
// import * as UNOFLASH from './filetoflashuno.hex';

const log = logger('FlashLib: ');
const FlashingFirmware = (port) => {
    try {
        let avrgirl = new AvrgirlArduino({
            board: 'uno',
            debug: true,
            port: port, //Does not have to be listed for flashing to work
            manualReset: true
        });

        avrgirl.list((err, ports) => {
            log.debug(JSON.stringify(ports));
        });

        // I commented this out for the time  being since I didn't want to fry my board if it failed
        avrgirl.flash('../../filetoflashuno.hex', error => {
            if (error) {
                log.debug(`${error} Error flashing board`);
            } else {
                log.debug('FLASH SUCCESFULL!!!');
            }
        });
    } catch (e) {
        log.error(e);
    }
};


export default FlashingFirmware;
