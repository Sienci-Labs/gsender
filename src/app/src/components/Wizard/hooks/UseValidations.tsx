import { GRBL, GRBL_ACTIVE_STATE_IDLE, GRBLHAL } from 'app/constants';
import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { TransKey, useAppTranslation } from 'app/i18n';
import { firmwareSemver } from 'app/lib/firmwareSemver.ts';
import type { RootState } from 'app/store/redux';
import { useMemo } from 'react';

export function useValidations() {
    const { t } = useAppTranslation();
    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const hasHomed = useTypedSelector(
        (state: RootState) => state.controller.hasHomed,
    );
    const reportedFirmwareSemver = useTypedSelector(
        (state: RootState) => state.controller.settings.version?.semver,
    );

    const currentFirmware = firmwareSemver(
        Number(reportedFirmwareSemver) || 0,
        ATCI_SUPPORTED_VERSION,
    );

    const firmwareType = useTypedSelector(
        (state: RootState) => state.controller.type,
    );

    const activeState = useTypedSelector(
        (state) => state?.controller.state?.status?.activeState,
    );

    const connectionValidation = useMemo(
        () => () => ({
            success: isConnected,
            reason: t('common:wizard.validation.notConnected'),
        }),
        [isConnected, t],
    );
    const homingValidation = useMemo(
        () => () => ({
            success: hasHomed,
            reason: t('common:wizard.validation.notHomed'),
        }),
        [hasHomed, t],
    );
    const coreFirmwareValidation = useMemo(
        () => () => ({
            success: currentFirmware,
            reason: (
                <p>
                    <TransKey
                        i18nKey="common:wizard.validation.firmwareTooOld"
                        components={{
                            link: (
                                <a
                                    target="_blank"
                                    className="text-blue-600 dark:text-blue-400 underline"
                                    href="https://resources.sienci.com/view/slb-firmware-flashing/"
                                    rel="noopener"
                                />
                            ),
                        }}
                    />
                </p>
            ),
        }),
        [currentFirmware],
    );

    const grblHAlValidator = useMemo(
        () => () => ({
            success: firmwareType === GRBLHAL,
            reason: t('common:wizard.validation.requiresGrblHal'),
        }),
        [firmwareType, t],
    );

    const grblValidator = useMemo(
        () => () => ({
            success: firmwareType === GRBL,
            reason: t('common:wizard.validation.requiresGrbl'),
        }),
        [firmwareType, t],
    );

    const activeStateCheck = useMemo(
        () => () => ({
            success: activeState === GRBL_ACTIVE_STATE_IDLE,
            reason: t('common:wizard.validation.notIdle'),
        }),
        [activeState, t],
    );

    return {
        connectionValidation,
        homingValidation,
        coreFirmwareValidation,
        grblHAlValidator,
        grblValidator,
        activeStateCheck,
    };
}
