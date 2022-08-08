import React, { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import Modal from 'app/components/Modal';
import { GRBL_ACTIVE_STATE_IDLE } from 'app/constants';
import store from 'app/store';
import libController from 'app/lib/controller';
import { Toaster, TOASTER_INFO, TOASTER_UNTIL_CLOSE } from 'app/lib/toaster/ToasterLib';

import { GRBL_SETTINGS } from 'server/controllers/Grbl/constants';

import SettingsArea from './components/Settings';
import ActionArea from './components/Actions';
import { FirmwareContext, controllerSettingsLoaded, addControllerEvents, removeControllerEvents } from './utils';
import styles from './index.styl';

const Firmware = ({ modalClose }) => {
    const isConnected = useSelector(store => get(store, 'connection.isConnected'));
    const eeprom = useSelector(store => get(store, 'controller.settings.settings'));
    const activeState = useSelector(store => get(store, 'controller.state.status.activeState'));
    const [initiateFlashing, setInitiateFlashing] = useState(false);
    const [shouldRestoreDefault, setShouldRestoreDefault] = useState(false);
    const [settings, setSettings] = useState(GRBL_SETTINGS.map(item => ({ ...item, value: eeprom ? eeprom[item.setting] : undefined })));
    const [filterText, setFilterText] = useState('');
    const [isFlashing, setIsFlashing] = useState(false);
    const [controller, setController] = useState(libController);

    useEffect(() => {
        addControllerEvents(controllerEvents);

        return () => {
            removeControllerEvents(controllerEvents);
        };
    }, []);

    useEffect(() => {
        setController(libController);
    }, [libController]);

    const controllerEvents = {
        'message': () => {
            setIsFlashing(false);
            modalClose();
            Toaster.pop({
                msg: `Flashing completed successfully on port: ${port}! Please reconnect your machine`,
                type: TOASTER_INFO,
            });
        },
        'task:error': (error) => {
            setIsFlashing(false);
            Toaster.pop({
                msg: error,
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
    const machineProfile = store.get('workspace.machineProfile');
    const hasSettings = controllerSettingsLoaded();
    const data = controller.settings;
    const port = controller.port;

    const contextValue = {
        hasSettings,
        machineProfile,
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
        setSettings,
        isDefault,
        controller,
        canSendSettings
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

                        {
                            hasSettings && (
                                <>
                                    <div className={styles.divider} />
                                    <ActionArea />
                                </>
                            )
                        }
                    </div>
                </div>
            </FirmwareContext.Provider>
        </Modal>
    );
}; Firmware.propTypes = { modalClose: PropTypes.func };

export default Firmware;
