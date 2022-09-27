import React, { useContext } from 'react';

import ToolsNotificationModal from 'app/components/ToolsNotificationModal/Modal';

import { FirmwareContext, getResetToDefaultMessage, restoreDefaultSettings, startFlash } from '../../utils';
import defaultGRBLSettings from '../../eepromFiles/DefaultGrblSettings.json';

const Notifications = () => {
    const {
        machineProfile,
        port,
        initiateFlashing,
        shouldRestoreDefault,
        setShouldRestoreDefault,
        setInitiateFlashing,
        setIsFlashing,
        setSettings,
    } = useContext(FirmwareContext);

    const beginFlashing = () => {
        startFlash(port);
        setInitiateFlashing(false);
        setIsFlashing(true);
    };

    const message = getResetToDefaultMessage(machineProfile);

    const restoreDefaults = () => {
        const machineProfileUpdated = { ...machineProfile, eepromSettings: machineProfile.eepromSettings ?? defaultGRBLSettings };
        restoreDefaultSettings(machineProfileUpdated);
        setSettings(prev => prev.map(item => ({ ...item, value: machineProfileUpdated.eepromSettings[item.setting] })));
        setShouldRestoreDefault(false);
    };

    return (
        <>
            {initiateFlashing && (
                <ToolsNotificationModal
                    title="Grbl Flashing"
                    onClose={() => setInitiateFlashing(false)}
                    show={initiateFlashing}
                    footer="This process will disconnect your machine, and may take a couple minutes to complete."
                    footerTwo="Continue?"
                    yesFunction={beginFlashing}
                >
                    This feature exists to flash the GRBL firmware onto compatible Arduino boards only!
                    Improper flashing could damage your device on port: <strong>{port}</strong>.
                </ToolsNotificationModal>
            )}

            {shouldRestoreDefault && (
                <ToolsNotificationModal
                    title="Restore Cnc Defaults"
                    onClose={() => setShouldRestoreDefault(false)}
                    show={shouldRestoreDefault}
                    footer="Restore your Cnc machine?"
                    yesFunction={restoreDefaults}
                >
                    {message}
                </ToolsNotificationModal>
            )}
        </>
    );
};

export default Notifications;
