import React, { useContext, useState } from 'react';
import store from 'app/store';
import { get } from 'lodash';
import reduxStore from 'app/store/redux';
import { GRBLHAL } from 'app/constants';
import ToolsNotificationModal from 'app/components/ToolsNotificationModal/Modal';
import { Toaster, TOASTER_WARNING } from 'app/lib/toaster/ToasterLib';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { FirmwareContext, getResetToDefaultMessage, restoreDefaultSettings, startFlash } from '../../utils';
import defaultGRBLSettings from '../../eepromFiles/DefaultGrblSettings.json';
import defaultGRBLHALSettings from '../../eepromFiles/DefaultGrblHalSettings.json';
import HalFlashModal from 'Containers/Firmware/components/HalFlashModal';

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
    const controllerType = store.get('widgets.connection.controller.type', 'invalid');

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
        const controllerType = get(reduxStore.getState(), 'controller.type', 'grbl');
        const machineProfileUpdated = {
            ...machineProfile,
            eepromSettings: machineProfile.eepromSettings ?? defaultGRBLSettings,
            grblHALeepromSettings: machineProfile.grblHALeepromSettings ?? defaultGRBLHALSettings,
        };

        restoreDefaultSettings(machineProfileUpdated, controllerType);
        setSettings(prev => prev.map(item => ({ ...item, value: machineProfileUpdated.grblHALeepromSettings[item.setting] })));
        setShouldRestoreDefault(false);
    };

    return (
        <>
            <div style={{ position: 'absolute', width: '968px' }}>
                {(initiateFlashing && controllerType === GRBLHAL) && (
                    <HalFlashModal
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
                    </HalFlashModal>
                )}

                {(initiateFlashing && controllerType !== GRBLHAL) && (
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
                        title="Restore CNC Defaults"
                        onClose={() => setShouldRestoreDefault(false)}
                        show={shouldRestoreDefault}
                        footer="Restore your CNC machine?"
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
                            <span>Flashing port {portSelected}</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Notifications;
