import React, { useContext } from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { descriptionLookup, FirmwareContext } from 'Containers/Firmware/utils';
import styles from 'Containers/Firmware/index.styl';
import CategoryTag from 'Containers/Firmware/components/Settings/CategoryTag';

const HalSettings = ({ descriptions }) => {
    const { settings } = useContext(FirmwareContext);

    return (
        <div className={styles.settingsContainer}>
            <div className={styles.tableHeader}>
                <div className={[styles['non-default-value'], styles.tableColumnEEPROM].join(' ')}>
                    <span>$ Setting</span>
                </div>
                <div className={styles.tableColumn}>
                    <span>Description</span>
                </div>
                <div className={styles.tableColumn}>
                    <span>Value</span>
                </div>

                <div className={styles.tableColumn} />
            </div>
            {
                settings.map((setting) => {
                    const settingKey = setting.setting.replace('$', '');
                    const { message, description } = descriptionLookup(settingKey, descriptions);

                    //const highlighted = false; // TODO: Logic for hal defaults
                    return (
                        <div key={setting.setting} className={styles.containerFluid}>
                            <div className={styles.tableRow}>
                                <div className={styles.keyRow}>
                                    {settingKey}
                                    <CategoryTag category={setting.category} />
                                </div>
                                <div className={styles.settingsInformation}>
                                    <div className={styles.setyarntingsDescription}>
                                        <div className={styles.itemText}>{message}</div>
                                        <div className={styles.descriptionRow}>
                                            {description}
                                        </div>
                                    </div>
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
        descriptions
    };
})(HalSettings);
