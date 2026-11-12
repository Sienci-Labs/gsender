import { tk } from 'app/i18n';
import type { ATCUnavailablePayload } from '../definitions';

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
            title: tk('atc:unavailable.notConnected.title'),
            message: tk('atc:unavailable.notConnected.message'),
        };
    }
    if (!isATCAvailable) {
        return {
            reason: 'firmware_not_compiled',
            title: tk('atc:unavailable.noAtcFlag.title'),
            message: tk('atc:unavailable.noAtcFlag.message'),
            additionalInfo: tk('atc:unavailable.noAtcFlag.additionalInfo'),
        };
    }
    /*if (!isHomed) {
        return {
            reason: 'machine_not_homed',
            title: 'Machine Not Homed',
            message: 'You must home the machine before using ATC.',
        };
    }*/

    return null;
};
