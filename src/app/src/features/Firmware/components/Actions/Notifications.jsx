import React, { useContext, useState } from 'react';
import { get } from 'lodash';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

import store from 'app/store';
import { store as reduxStore } from 'app/store/redux';
import { GRBLHAL } from 'app/constants';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from 'app/components/shadcn/Dialog';
import { Toaster, TOASTER_WARNING } from 'app/lib/toaster/ToasterLib';
import Button from 'app/components/Button';

import {
    FirmwareContext,
    getResetToDefaultMessage,
    restoreDefaultSettings,
    startFlash,
} from '../../utils';
import defaultGRBLSettings from '../../eepromFiles/DefaultGrblSettings.json';
import defaultGRBLHALSettings from '../../eepromFiles/DefaultGrblHalSettings.json';
import HalFlashModal from '../HalFlashModal';
import { toast } from 'app/lib/toaster';

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
    const controllerType = store.get(
        'widgets.connection.controller.type',
        'invalid',
    );

    const beginFlashing = (port, profile) => {
        if (profile === '' || port === '') {
            toast.info('Please select a Port and Machine profile', {
                position: 'bottom-right',
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
        const controllerType = get(
            reduxStore.getState(),
            'controller.type',
            'grbl',
        );
        const machineProfileUpdated = {
            ...machineProfile,
            eepromSettings:
                machineProfile.eepromSettings ?? defaultGRBLSettings,
            grblHALeepromSettings:
                machineProfile.grblHALeepromSettings ?? defaultGRBLHALSettings,
        };

        restoreDefaultSettings(machineProfileUpdated, controllerType);
        setSettings((prev) =>
            prev.map((item) => ({
                ...item,
                value: machineProfileUpdated.grblHALeepromSettings[
                    item.setting
                ],
            })),
        );
        setShouldRestoreDefault(false);
    };

    return (
        <>
            <div className="absolute w-[968px]">
                {initiateFlashing && controllerType === GRBLHAL && (
                    <HalFlashModal
                        title="grblHAL Flashing"
                        onClose={() => setInitiateFlashing(false)}
                        show={initiateFlashing}
                        footer="This process will disconnect your machine, and may take a couple minutes to complete."
                        footerTwo="Continue?"
                        yesFunction={beginFlashing}
                        showOptions={true}
                    >
                        This feature exists to flash the GRBL firmware onto
                        compatible Arduino boards only! Improper flashing could
                        damage your device.
                    </HalFlashModal>
                )}

                {initiateFlashing && controllerType !== GRBLHAL && (
                    <Dialog
                        open={initiateFlashing}
                        onOpenChange={() => setInitiateFlashing(false)}
                    >
                        <DialogContent className="bg-white">
                            <DialogHeader>
                                <DialogTitle>Grbl Flashing</DialogTitle>
                                <DialogDescription>
                                    <p className="mb-4">
                                        This feature exists to flash the GRBL
                                        firmware onto compatible Arduino boards
                                        only! Improper flashing could damage
                                        your device.
                                    </p>

                                    <p className="mb-4">
                                        This process will disconnect your
                                        machine, and may take a couple minutes
                                        to complete.
                                    </p>

                                    <p className="mb-4">
                                        Would you like to continue?
                                    </p>
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button onClick={() => beginFlashing('', '')}>
                                    Yes
                                </Button>
                                <Button
                                    color="secondary"
                                    onClick={() => setInitiateFlashing(false)}
                                >
                                    No, Cancel
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {shouldRestoreDefault && (
                    <Dialog
                        open={shouldRestoreDefault}
                        onOpenChange={() => setShouldRestoreDefault(false)}
                    >
                        <DialogContent className="bg-white">
                            <DialogHeader>
                                <DialogTitle>Restore CNC Defaults</DialogTitle>
                                <DialogDescription>{message}</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button onClick={restoreDefaults}>Yes</Button>
                                <Button
                                    color="secondary"
                                    onClick={() =>
                                        setShouldRestoreDefault(false)
                                    }
                                >
                                    No, Cancel
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
