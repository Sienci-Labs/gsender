import React, { useEffect, useMemo, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBLHAL,
    USAGE_TOOL_NAME,
} from 'app/constants';
import store from 'app/store';
import libController from 'app/lib/controller';

import { GRBL_SETTINGS } from 'app/constants/firmware/grbl';
import { GRBL_HAL_SETTINGS } from 'app/constants/firmware/grblHAL';

import SettingsArea from './components/Settings';
import ActionArea from './components/Actions';
import {
    addControllerEvents,
    controllerSettingsLoaded,
    FirmwareContext,
    getFilteredEEPROM,
    removeControllerEvents,
} from './utils';
import { collectUserUsageData } from '../../lib/heatmap';

import styles from './index.module.styl';
import { toast } from 'app/lib/toaster';

const Firmware = ({ modalClose, halDescriptions, halGroups }) => {
    const isConnected = useSelector((store) =>
        get(store, 'connection.isConnected'),
    );
    const eeprom = useSelector((store) =>
        get(store, 'controller.settings.settings'),
    );
    const activeState = useSelector((store) =>
        get(store, 'controller.state.status.activeState'),
    );
    const controllerType = useSelector((store) =>
        get(store, 'controller.type'),
    );
    const SETTINGS =
        controllerType === GRBLHAL ? GRBL_HAL_SETTINGS : GRBL_SETTINGS;
    const [initiateFlashing, setInitiateFlashing] = useState(false);
    const [shouldRestoreDefault, setShouldRestoreDefault] = useState(false);
    const [settings, setSettings] = useState(
        getFilteredEEPROM(SETTINGS, eeprom, halDescriptions, halGroups),
    );
    const [filterText, setFilterText] = useState('');
    const [isFlashing, setIsFlashing] = useState(false);
    const [controller, setController] = useState(libController);
    const [settingsToApply, setSettingsToApply] = useState(false);
    const [machineProfile, setMachineProfile] = useState(
        store.get('workspace.machineProfile'),
    );

    useEffect(() => {
        addControllerEvents(controllerEvents);

        const timeout = setTimeout(() => {
            collectUserUsageData(USAGE_TOOL_NAME.FIRMWARE);
        }, 5000);

        return () => {
            clearTimeout(timeout);
            removeControllerEvents(controllerEvents);
        };
    }, []);

    useEffect(() => {
        setController(libController);
    }, [libController]);

    useEffect(() => {
        setSettings(
            getFilteredEEPROM(SETTINGS, eeprom, halDescriptions, halGroups),
        );
    }, [eeprom, halDescriptions, halGroups]);

    const controllerEvents = {
        message: (message) => {
            setIsFlashing(false);
            modalClose();
            toast.info(
                `Flashing completed successfully on port: ${JSON.stringify(
                    message,
                )}  Please reconnect your machine`,
                { position: 'bottom-right' },
            );
        },
        'task:error': (error) => {
            setIsFlashing(false);
            toast.error(
                JSON.stringify(
                    isEmpty(error) ? error : 'Process failed.',
                ).replaceAll('"', ''),
                { position: 'bottom-right' },
            );
        },
        'serialport:open': () => {
            controller.command('gcode', '$$');
        },
    };

    const filteredSettings = useMemo(
        () =>
            settings.filter((setting) =>
                JSON.stringify(setting)
                    .toLowerCase()
                    .includes(filterText.toLowerCase()),
            ),
        [settings, filterText],
    );
    const isDefault = useMemo(
        () => settings.every((item) => eeprom?.[item?.setting] === item?.value),
        [settings],
    );
    const canSendSettings = useMemo(
        () => isConnected && activeState === GRBL_ACTIVE_STATE_IDLE,
        [isConnected, activeState],
    );
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
        setSettingsToApply,
    };

    return (
        <FirmwareContext.Provider value={contextValue}>
            <div className="bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-900 px-4 py-3 shadow-md mb-4" role="alert">
                <div className="flex">
                    <div className="py-1">
                        <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path
                                d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold">Deprecated Tool</p>
                        <p className="text-sm">This tool has been deprecated and will be removed in a future version.  We recommend you use Config instead.</p>
                    </div>
                </div>
            </div>
            <div className={styles.toolModal}>
                <div className={styles.firmwareHeader}>
                    <h3 className={styles.firmwareHeaderText}>Firmware Tool</h3>
                </div>
                <div className={styles.firmwareContainer}>
                    <SettingsArea/>

                    <div className={styles.divider}/>

                    <ActionArea/>
                </div>
            </div>
        </FirmwareContext.Provider>
    );
};
Firmware.propTypes = { modalClose: PropTypes.func };

export default connect((store) => {
    const halDescriptions = get(store, 'controller.settings.descriptions', {});
    const halGroups = get(store, 'controller.settings.groups', {});

    return {
        halDescriptions: { ...halDescriptions },
        halGroups: { ...halGroups },
    };
})(Firmware);
