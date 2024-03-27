import React, { useContext } from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { descriptionLookup, FirmwareContext, getDatatypeInput } from 'Containers/Firmware/utils';
import styles from 'Containers/Firmware/index.styl';
import CategoryTag from 'Containers/Firmware/components/Settings/CategoryTag';

const getCharCodeSum = (str = 'a') => {
    return str
        .split('')
        .reduce((acc, c) => acc + c.charCodeAt(0), 0);
};

const HalSettings = ({ descriptions }) => {
    const { settings, setSettings, setSettingsToApply } = useContext(FirmwareContext);
    const handleSettingsChange = (index) => (value) => {
        setSettingsToApply(true);
        setSettings(prev => {
            const updated = [...prev];

            updated[index].value = value;
            return updated;
        });
    };

    const filterNewlines = (data = '') => {
        if (!data) {
            return '';
        }
        return data.replace(/\\n/gmi, '\n');
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
                    const { message, dataType, ...info } = descriptionLookup(settingKey, descriptions);
                    const description = filterNewlines(setting.details);
                    const InputElement = getDatatypeInput(dataType);

                    const groupLabel = setting.group || '';

                    //const categoryClass = (Number(setting.groupID ? setting.groupID : 0) % 9) + 1;
                    const categoryClass = (getCharCodeSum(groupLabel) % 9) + 1;

                    //const highlighted = false; // TODO: Logic for hal defaults
                    return (
                        <div key={setting.setting} className={styles.containerFluid}>
                            <div className={styles.tableRowHal}>
                                <div className={styles.keyRow}>
                                    {settingKey}
                                    <CategoryTag category={groupLabel} isHAL={categoryClass}/>
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
                                    <InputElement info={info} setting={setting} onChange={handleSettingsChange(setting.globalIndex)} />
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

    return {
        descriptions,
    };
})(HalSettings);
