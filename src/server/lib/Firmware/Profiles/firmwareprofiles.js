/* eslint-disable no-unused-vars */
import store from '../../../store';
import LongMill from '!raw-loader!./EepromFiles/Sienci Long Mill.txt';
import MillOne from '!raw-loader!./EepromFiles/Sienci MillOne.txt';

const path = require('path');

const FirmwareProfiles = (recievedPortNumber) => {
    const controller = store.get('controllers["' + recievedPortNumber + '"]');
    const testFolder = path.resolve('../../src/server/lib/Firmware/Profiles/EepromFiles');
    const fs = require('fs');

    async function funct() {
        let fileNames = [];
        try {
            fs.readdir(testFolder, (err, files) => {
                if (err) {
                    console.log('ERROR: ' + err);
                    controller.command('firmware:dubugging', err);
                }
                files.forEach(file => {
                    if (fs.lstatSync(path.resolve(testFolder, file)).isDirectory()) {
                        console.log('Directory: ' + file);
                    } else {
                        controller.command('firmware:dubugging', file);
                        fileNames.push(file);
                        controller.command('firmware:recievedProfiles', fileNames);
                    }
                });
                // controller.command('firmware:recievedProfiles', fileNames);
            });
        } finally {
            await console.log('inside finally');

            // await filehandle.close();
        }
    }
    funct().catch(console.error);

    let applySettings = (recievedPortNumber) => {
        console.log('APPLIED SETTINGS CALLED');
    };
};


export default FirmwareProfiles;
