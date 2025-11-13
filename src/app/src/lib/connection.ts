import { GRBL } from 'app/constants';
import WidgetConfig from 'app/features/WidgetConfig/WidgetConfig';
import controller from './controller';
import { isIPv4 } from './utils';
import store from 'app/store';

export const connectToLastDevice = (callback: () => any) => {
    const connectionConfig = new WidgetConfig('connection');

    const port = connectionConfig.get('port');
    const baudrate = connectionConfig.get('baudrate');
    const defaultFirmware = store.get('workspace.defaultFirmware', GRBL);

    const isNetwork = isIPv4(port); // Do we look like an IP address?

    controller.openPort(
        port,
        // controllerType,
        {
            baudrate,
            rtscts: false,
            network: isNetwork,
            defaultFirmware,
        },
        (err: any) => {
            if (err) {
                return;
            }
            callback && callback();
        },
    );
};
