import React, { useContext } from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { descriptionLookup, FirmwareContext, getDatatypeInput } from 'Containers/Firmware/utils';
import styles from 'Containers/Firmware/index.styl';
import CategoryTag from 'Containers/Firmware/components/Settings/CategoryTag';

const HalSettings = ({ descriptions, groups }) => {
    const { settings, setSettings, setSettingsToApply } = useContext(FirmwareContext);

    const handleSettingsChange = (index) => (value) => {
        setSettingsToApply(true);
        setSettings(prev => {
            const updated = [...prev];
            updated[index].value = value;
            return updated;
        });
    };


    return (
        <div className={styles.settingsContainer}>
            <div className={styles.tableHeaderHal}>
                <div className={[styles['non-default-value'], styles.tableColumnEEPROM].join(' ')}>
                    <span>$ Setting</span>
                </div>
                <div className={styles.tableColumn}>
                    <span>Description</span>
                </div>
                <div className={styles.tableColumn}>
                    <span>Value</span>
                </div>
            </div>
            {
                settings.map((setting, index) => {
                    const settingKey = setting.setting.replace('$', '');
                    const { message, description, dataType, ...info } = descriptionLookup(settingKey, descriptions);
                    const InputElement = getDatatypeInput(dataType);

                    const groupLabel = groups[descriptions[settingKey].group].label;

                    //const highlighted = false; // TODO: Logic for hal defaults
                    return (
                        <div key={setting.setting} className={styles.containerFluid}>
                            <div className={styles.tableRowHal}>
                                <div className={styles.keyRow}>
                                    {settingKey}
                                    <CategoryTag category={groupLabel} isHAL/>
                                </div>
                                <div className={styles.settingsInformation}>
                                    <div className={styles.settingsDescription}>
                                        <div className={styles.itemText}>{message}</div>
                                        <div className={styles.descriptionRow}>
                                            {description}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.settingsControl}>
                                    <InputElement info={info} setting={setting} onChange={handleSettingsChange(index)} />
                                </div>
                            </div>
                        </div>
                    );
                })
            }
        </div>
    );
};

export default connect((store) => {
    const descriptions = get(store, 'controller.settings.descriptions', {});
    const groups = get(store, 'controller.settings.groups', {});

    return {
        descriptions,
        groups
    };
})(HalSettings);
