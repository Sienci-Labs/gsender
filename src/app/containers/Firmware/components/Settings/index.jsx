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
            <strong>{`${machineProfile?.company} ${machineProfile?.name} ${machineProfile?.version}`}</strong>
        </>
    );

    return hasSettings ? (
        <div className={styles.settingsAreaContainer}>
            {machineProfile && <p style={{ margin: 0 }}>{machineName}</p>}
            <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                <SettingsList />
            </div>
            <SearchBar />
        </div>
    ) : <NotConnectedWarning onReconnectClick={() => connectToLastDevice()} />;
};

export default SettingsArea;
