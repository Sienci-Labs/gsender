import { useMemo } from 'react';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { firmwareSemver } from 'app/lib/firmwareSemver.ts';
import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants.ts';

export function useValidations() {
    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const hasHomed = useTypedSelector(
        (state: RootState) => state.controller.state?.status?.hasHomed,
    );
    const reportedFirmwareSemver = useTypedSelector(
        (state: RootState) => state.controller.settings.version?.semver,
    );

    const currentFirmware = firmwareSemver(
        Number(reportedFirmwareSemver) || 0,
        ATCI_SUPPORTED_VERSION,
    );

    const connectionValidation = useMemo(
        () => () => ({
            success: isConnected,
            reason: 'Your controller is not connected.  Connect to your controller to configure your Sienci ATC.',
        }),
        [isConnected],
    );
    const homingValidation = useMemo(
        () => () => ({
            success: hasHomed,
            reason: 'Machine not homed. Please home your machine before proceeding with ATC configuration.',
        }),
        [hasHomed],
    );
    const coreFirmwareValidation = useMemo(
        () => () => ({
            success: currentFirmware,
            reason: 'You must be running a more current version of the firmware to use this feature.',
        }),
        [currentFirmware],
    );
    return {
        connectionValidation,
        homingValidation,
        coreFirmwareValidation,
    };
}
