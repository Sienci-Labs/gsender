import React, { useContext } from 'react';

import SettingsList from './List';
import SearchBar from './SearchBar';
import { connectToLastDevice, FirmwareContext } from '../../utils';
import NotConnectedWarning from '../NotConnected/NotConnectedWarning';

import styles from '../../index.styl';

const SettingsArea = () => {
    const { hasSettings, machineProfile } = useContext(FirmwareContext);

    const machineName = (
        <>
            Machine Profile:{' '}
            <strong>{`${machineProfile?.name} ${machineProfile?.type}`}</strong>
        </>
    );

    return hasSettings ? (
        <div className={styles.settingsAreaContainer}>
            {machineProfile && <p style={{ margin: 0 }}>{machineName}</p>}
            <SearchBar />
            <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                <SettingsList />
            </div>
        </div>
    ) : <NotConnectedWarning onReconnectClick={() => connectToLastDevice()} />;
};

export default SettingsArea;
