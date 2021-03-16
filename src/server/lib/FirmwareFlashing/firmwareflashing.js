import SerialPort from 'serialport';
import AvrgirlArduino from 'avrgirl-arduino';
import logger from '../logger';
// import * as UNOFLASH from './filetoflashuno.hex';

const log = logger('FLASHING FIRMWARE: ');
// const fs = require('fs');

const FlashingFirmware = () => {
    let port = new SerialPort('COM3', {
        baudRate: 9600,
        autoOpen: true
    }, false);

    port.open(() => {
        log.debug('Trying to open the port...');
    });

    log.debug('Is the port open?' + port.isOpen);
    log.debug('Is the port path:' + port.path);

    let avrgirl = new AvrgirlArduino({
        board: 'uno',
        debug: true,
        // port: 'COM3', Does not have to be listed for flashing to work
        manualReset: true
    });

    avrgirl.list((err, ports) => {
        log.debug(JSON.stringify(ports));
    });

    avrgirl.flash('../../filetoflashuno.hex', error => {
        if (error) {
            log.debug(`${error} Error flashing board`);
        } else {
            log.debug('FLASH SUCCESFULL!!!');
        }
    });

    port.on('open', () => {
        log.debug('Opened port!');
    });

    port.on('close', () => {
        log.debug('closed port');
    });
    port.on('data', (data) => {
        log.debug(`${data}: DATA SENT/RECIEVED`);
    });

    port.on('error', (error) => {
        log.debug(`${error}: error on serial`);
    });
};


export default FlashingFirmware;
