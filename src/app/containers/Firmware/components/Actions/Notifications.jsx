import React, { useContext, useState } from 'react';

import ToolsNotificationModal from 'app/components/ToolsNotificationModal/Modal';
import { Toaster, TOASTER_WARNING } from 'app/lib/toaster/ToasterLib';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { FirmwareContext, getResetToDefaultMessage, restoreDefaultSettings, startFlash } from '../../utils';
import defaultGRBLSettings from '../../eepromFiles/DefaultGrblSettings.json';

const Notifications = () => {
    const {
        machineProfile,
        initiateFlashing,
        shouldRestoreDefault,
        setShouldRestoreDefault,
        setInitiateFlashing,
        setIsFlashing,
        isFlashing,
        setSettings,
    } = useContext(FirmwareContext);

    const [portSelected, setPortSelected] = useState('');

    const beginFlashing = (port, profile) => {
        if (profile === '' || port === '') {
            Toaster.pop({
                msg: 'Please select a Port and Machine profile',
                type: TOASTER_WARNING,
                duration: 2500
            });
        } else {
            setPortSelected(port);
            startFlash(port, profile);
            setInitiateFlashing(false);
            setIsFlashing(true);
        }
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
            <div style={{ position: 'absolute', width: '968px' }}>
                {initiateFlashing && (
                    <ToolsNotificationModal
                        title="Grbl Flashing"
                        onClose={() => setInitiateFlashing(false)}
                        show={initiateFlashing}
                        footer="This process will disconnect your machine, and may take a couple minutes to complete."
                        footerTwo="Continue?"
                        yesFunction={beginFlashing}
                        showOptions={true}
                    >
                        This feature exists to flash the GRBL firmware onto compatible Arduino boards only!
                        Improper flashing could damage your device.
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
                {isFlashing && (
                    <div className="progressBar">
                        <Box sx={{ width: '100%' }}>
                            <LinearProgress />
                        </Box>
                        <div className="flashMessage">
                            Flashing port {portSelected}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Notifications;
