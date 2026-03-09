import { ATCUnavailablePayload } from '../definitions';

export const getATCUnavailablePayload = ({
    isConnected,
    isATCAvailable,
    isHomed,
}: {
    isConnected: boolean;
    isATCAvailable: boolean;
    isHomed: boolean;
}): ATCUnavailablePayload => {
    if (!isConnected) {
        return {
            reason: 'machine_not_connected',
            title: 'Machine Not Connected',
            message:
                'You must be connected to a device with ATC support to use this feature.',
        };
    }
    if (!isATCAvailable) {
        return {
            reason: 'firmware_not_compiled',
            title: 'Firmware Not Compiled',
            message: 'Firmware did not report ATC=1 on startup.',
            additionalInfo:
                'Ensure the SD card is installed and mounted correct and the firmware has ATC support compiled in.',
        };
    }
    if (!isHomed) {
        return {
            reason: 'machine_not_homed',
            title: 'Machine Not Homed',
            message: 'You must home the machine before using ATC.',
        };
    }

    return null;
};
