import LongMill from '!raw-loader!./EepromFiles/Sienci Long Mill.txt';
import MillOne from '!raw-loader!./EepromFiles/Sienci MillOne.txt';
import map from 'lodash/map';
import store from '../../../store';

const ApplyFirmwareProfile = (profile, recievedPortNumber) => {
    const gcode = (cmd, params) => {
        const s = map(params, (value, letter) => String(letter + value)).join('=');
        return (s.length > 0) ? (cmd + '' + s) : cmd;
    };


    const controller = store.get('controllers["' + recievedPortNumber + '"]');
    let settings = '';
    if (profile === 'Sienci Long Mill') {
        settings = LongMill;
    } else if (profile === 'Sienci MillOne') {
        settings = MillOne;
    }
    const obj = JSON.parse(settings);
    let values = Object.values(obj);
    if (values.length === 34) {
        for (let i = 0; i < values.length; i++) {
            if (values[i] === true) {
                values[i] = '1';
            } if (values[i] === false) {
                values[i] = '0';
            }
        }

        let keys = Object.keys(obj);
        let finalStrings = [];
        const valuesToSubmit = [];
        for (let i = 0; i < keys.length; i++) {
            valuesToSubmit.push([keys[i], values[i]]);
        }
        let gCoded = gcode(valuesToSubmit);

        for (let j = 0; j < gCoded.length; j++) {
            finalStrings[j] = gCoded[j].join('=');
        }
        controller.command('gcode', finalStrings);
        controller.command('gcode', '$$');
    }
};

export default ApplyFirmwareProfile;
