import React, { useContext } from 'react';
import Select from 'react-select';
import store from 'app/store';
import controller from 'app/lib/controller';
import WidgetConfig from 'app/widgets/WidgetConfig';
import SettingsList from './List';
import SearchBar from './SearchBar';
import { connectToLastDevice, FirmwareContext } from '../../utils';
import machineProfiles from '../defaultMachineProfiles';
import NotConnectedWarning from '../NotConnected/NotConnectedWarning';

import styles from '../../index.styl';

const getMachineProfileLabel = ({ name, type }) => `${name} ${type && type}`.trim();


const SettingsArea = () => {
    const { hasSettings, machineProfile, setMachineProfile } = useContext(FirmwareContext);
    const label = getMachineProfileLabel(machineProfile);
    const connectionConfig = new WidgetConfig('connection');
    const port = connectionConfig.get('port');

    const handleSelect = ({ value = 0 }) => {
        const foundProfile = machineProfiles.find(profile => profile.id === value);

        if (foundProfile) {
            const updatedObj = {
                ...foundProfile,
                limits: {
                    xmin: 0,
                    ymin: 0,
                    zmin: 0,
                    xmax: foundProfile.mm.width,
                    ymax: foundProfile.mm.depth,
                    zmax: foundProfile.mm.height,
                }
            };
            store.replace('workspace.machineProfile', updatedObj);
            setMachineProfile(updatedObj);
            controller.command('machineprofile:load', updatedObj);
        }
    };

    return (
        <div className={styles.settingsAreaContainer}>
            {
                (machineProfile) && (
                    <>
                        <div className={styles.profileSelect}><span>Profile: </span>
                            <Select
                                className={styles.profileSelectDropdown}
                                value={{ label: label }}
                                options={
                                    machineProfiles
                                        .sort((a, b) => getMachineProfileLabel(a).localeCompare(getMachineProfileLabel(b)))
                                        .map(({ id, name, type }) => ({ key: id, value: id, label: getMachineProfileLabel({ name, type }) }))
                                }
                                onChange={handleSelect}
                                clearable={false}
                            />
                        </div>
                    </>
                )
            }
            {
                hasSettings && (
                <>
                    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                        <SettingsList />
                    </div>
                    <SearchBar />
                </>
                )
            }
            {
                !hasSettings && <NotConnectedWarning onReconnectClick={() => connectToLastDevice()} disabled={!port} />
            }
        </div>
    );
};

export default SettingsArea;
