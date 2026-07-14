import { GRBL } from 'app/constants';
import WidgetConfig from 'app/features/WidgetConfig/WidgetConfig';
import controller from './controller';
import { isIPv4 } from './utils';
import store from 'app/store';
import { toast } from 'app/lib/toaster';

export const connectToLastDevice = (callback: () => any) => {
    const connectionConfig = new WidgetConfig('connection');

    const port = connectionConfig.get('port');
    const baudrate = connectionConfig.get('baudrate');
    const defaultFirmware = store.get('workspace.defaultFirmware', GRBL);

    const isNetwork = isIPv4(port); // Do we look like an IP address?
    const ethernetPort = connectionConfig.get('ethernetPort', 23);

    controller.openPort(
        port,
        // controllerType,
        {
            baudrate,
            rtscts: false,
            network: isNetwork,
            defaultFirmware,
            ethernetPort,
        },
        (err: any) => {
            if (err) {
                toast.error(
                    `Unable to reconnect to ${port} - ${err.message || err}`,
                    { position: 'bottom-right' },
                );
                return;
            }
            callback && callback();
        },
    );
};
