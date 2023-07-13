import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import Modal from 'app/components/Modal';
import { GRBL_ACTIVE_STATE_IDLE, GRBLHAL } from 'app/constants';
import store from 'app/store';
import libController from 'app/lib/controller';
import { Toaster, TOASTER_INFO, TOASTER_UNTIL_CLOSE } from 'app/lib/toaster/ToasterLib';

import { GRBL_SETTINGS } from 'server/controllers/Grbl/constants';
import { GRBL_HAL_SETTINGS } from 'server/controllers/Grblhal/constants';


import SettingsArea from './components/Settings';
import ActionArea from './components/Actions';
import { addControllerEvents, controllerSettingsLoaded, FirmwareContext, removeControllerEvents } from './utils';
import styles from './index.styl';

const getFilteredEEPROM = (settings, eeprom = {}) => {
    return Object.keys(eeprom).map((setting) => {
        const properties = settings.find(obj => {
            return obj.setting === setting;
        });
        return {
            ...properties || {},
            setting: setting,
            value: eeprom[setting]
        };
    });
};

const Firmware = ({ modalClose }) => {
    const isConnected = useSelector(store => get(store, 'connection.isConnected'));
    const eeprom = useSelector(store => get(store, 'controller.settings.settings'));
    const activeState = useSelector(store => get(store, 'controller.state.status.activeState'));
    const controllerType = useSelector(store => get(store, 'controller.type'));
    const SETTINGS = controllerType === GRBLHAL ? GRBL_HAL_SETTINGS : GRBL_SETTINGS;
    const [initiateFlashing, setInitiateFlashing] = useState(false);
    const [shouldRestoreDefault, setShouldRestoreDefault] = useState(false);
    const [settings, setSettings] = useState(getFilteredEEPROM(SETTINGS, eeprom));
    const [filterText, setFilterText] = useState('');
    const [isFlashing, setIsFlashing] = useState(false);
    const [controller, setController] = useState(libController);
    const [settingsToApply, setSettingsToApply] = useState(false);
    const [machineProfile, setMachineProfile] = useState(store.get('workspace.machineProfile'));


    useEffect(() => {
        addControllerEvents(controllerEvents);

        return () => {
            removeControllerEvents(controllerEvents);
        };
    }, []);

    useEffect(() => {
        setController(libController);
    }, [libController]);

    useEffect(() => {
        setSettings(getFilteredEEPROM(SETTINGS, eeprom));
    }, [eeprom]);

    const controllerEvents = {
        'message': (message) => {
            setIsFlashing(false);
            modalClose();
            Toaster.pop({
                msg: `Flashing completed successfully on port: ${JSON.stringify(message)}  Please reconnect your machine`,
                type: TOASTER_INFO,
            });
        },
        'task:error': (error) => {
            setIsFlashing(false);
            Toaster.pop({
                msg: JSON.stringify(error !== {} ? error : 'Process failed.').replaceAll('"', ''),
                type: TOASTER_UNTIL_CLOSE,
                duration: 10000
            });
        },
        'serialport:open': () => {
            controller.command('gcode', '$$');
        },
    };

    const filteredSettings =
        useMemo(
            () => settings.filter(
                setting => JSON.stringify(setting).toLowerCase().includes(filterText.toLowerCase())
            ), [settings, filterText]
        );
    const isDefault = useMemo(() => settings.every(item => eeprom?.[item?.setting] === item?.value), [settings]);
    const canSendSettings = useMemo(() => isConnected && activeState === GRBL_ACTIVE_STATE_IDLE, [isConnected, activeState]);
    const hasSettings = controllerSettingsLoaded();
    const data = controller.settings;
    const port = controller.port;

    const contextValue = {
        hasSettings,
        machineProfile,
        setMachineProfile,
        isConnected,
        eeprom,
        activeState,
        data,
        port,
        initiateFlashing,
        setInitiateFlashing,
        shouldRestoreDefault,
        setShouldRestoreDefault,
        settings: filteredSettings,
        setFilterText,
        filterText,
        isFlashing,
        setIsFlashing,
        setSettings,
        isDefault,
        controller,
        canSendSettings,
        settingsToApply,
        setSettingsToApply
    };

    return (
        <Modal onClose={modalClose}>
            <FirmwareContext.Provider value={contextValue}>
                <div className={styles.toolModal}>
                    <div className={styles.firmwareHeader}>
                        <h3 className={styles.firmwareHeaderText}>Firmware Tool</h3>
                    </div>
                    <div className={styles.firmwareContainer}>
                        <SettingsArea />
                        <>
                            <div className={styles.divider} />
                            <ActionArea />
                        </>
                    </div>
                </div>
            </FirmwareContext.Provider>
        </Modal>
    );
}; Firmware.propTypes = { modalClose: PropTypes.func };

export default Firmware;
