import store from '../../../store';

const FirmwareProfiles = (recievedPortNumber) => {
    const controller = store.get('controllers["' + recievedPortNumber + '"]');
    let fileNames = ['Sienci Long Mill.txt', 'Sienci MillOne.txt'];
    controller.command('firmware:recievedProfiles', fileNames);
};

export default FirmwareProfiles;
