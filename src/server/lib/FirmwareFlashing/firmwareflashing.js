// import controller from 'app/lib/controller';
import AvrgirlArduino from 'avrgirl-arduino';
import logger from '../logger';
//import UNOFLASH from './filetoflashuno.hex';

const log = logger('FLASHING FIRMWARE: ');

const FlashingFirmware = () => {
    const reader = new FileReader();
    reader.readAsArrayBuffer('');

    reader.onload = event => {
        const filecontents = event.target.result;

        let avrgirl = new AvrgirlArduino({
            board: 'uno',
            debug: true,
            port: 'COM3'
        });

        avrgirl.flash(filecontents, error => {
            if (error) {
                console.error(error);
                log.debug(`${error} Error flashing board`);
            } else {
                log.debug(`${filecontents} FLASH SUCCESFULL!!!`);
                console.info('flash successful');
            }
        });
    };
};


export default FlashingFirmware;
