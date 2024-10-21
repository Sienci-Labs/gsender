import React, { useContext } from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';
import classname from 'classnames';
import { FaUndo } from 'react-icons/fa';

import { GRBLHAL, GRBL_ACTIVE_STATE_ALARM } from 'app/constants';
import Tooltip from 'app/components/Tooltip';
import Button from 'app/components/Button';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import {
    descriptionLookup,
    FirmwareContext,
    getDatatypeInput,
    restoreSingleDefaultSetting,
} from '../../utils';
import styles from '../../index.module.styl';
import CategoryTag from '../Settings/CategoryTag';
import classNames from 'classnames';

const getCharCodeSum = (str = 'a') => {
    return str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
};

const HalSettings = ({ descriptions, isAlarm }) => {
    const {
        hasSettings,
        machineProfile,
        settings,
        setFilterText,
        setSettings,
        setSettingsToApply,
    } = useContext(FirmwareContext);
    const handleSettingsChange = (index) => (value) => {
        setSettingsToApply(true);
        setSettings((prev) => {
            const updated = [...prev];

            updated[index].value = value;
            return updated;
        });
    };

    const filterNewlines = (data = '') => {
        if (!data) {
            return '';
        }
        return data.replace(/\\n/gim, '\n');
    };

    const handleResetToDefaultValue = (setting) => (event) => {
        Confirm({
            title: 'Reset Single EEPROM Value',
            content: 'Are you sure you want to reset this value to default?',
            confirmLabel: 'Yes',
            onConfirm: () => {
                restoreSingleDefaultSetting(setting, machineProfile, GRBLHAL);
            },
        });
    };

    return (
        <div className={styles.settingsContainer}>
            <div className={styles.tableHeaderHal}>
                <div
                    className={classNames(
                        styles.nonDefaultValue,
                        styles.tableColumnEEPROM,
                    )}
                >
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
            {hasSettings && (
                <>
                    {settings.length > 0 ? (
                        settings.map((setting, index) => {
                            const settingKey = setting.setting.replace('$', '');
                            const { message, dataType, ...info } =
                                descriptionLookup(settingKey, descriptions);
                            const description = filterNewlines(setting.details);
                            const InputElement = getDatatypeInput(dataType);

                            const groupLabel = setting.group || '';

                            //const categoryClass = (Number(setting.groupID ? setting.groupID : 0) % 9) + 1;
                            const categoryClass =
                                (getCharCodeSum(groupLabel) % 9) + 1;

                            const defaultValue =
                                machineProfile?.grblHALeepromSettings[
                                    setting.setting
                                ];

                            const settingIsNumberValue = !(
                                Number.isNaN(defaultValue) ||
                                Number.isNaN(defaultValue)
                            );

                            const isSameAsDefault = settingIsNumberValue
                                ? `${Number(setting.value)}` ===
                                  `${Number(defaultValue)}`
                                : setting.value === defaultValue;

                            const isSienciMachine =
                                machineProfile?.company?.includes(
                                    'Sienci Labs',
                                );

                            const highlighted =
                                !isSameAsDefault && isSienciMachine
                                    ? { backgroundColor: '#f2f2c2' }
                                    : {};

                            return (
                                <div
                                    key={setting.setting}
                                    className={styles.containerFluid}
                                    style={highlighted}
                                >
                                    <div className={styles.tableRowHal}>
                                        <div className={styles.keyRow}>
                                            {settingKey}
                                            <CategoryTag
                                                category={groupLabel}
                                                isHAL={categoryClass}
                                            />
                                        </div>
                                        <div
                                            className={
                                                styles.settingsInformation
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.settingsDescription
                                                }
                                            >
                                                <div
                                                    className={styles.itemText}
                                                >
                                                    {message}
                                                </div>
                                                <div
                                                    className={
                                                        styles.descriptionRow
                                                    }
                                                >
                                                    {description}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.settingsControl}>
                                            <InputElement
                                                info={info}
                                                setting={setting}
                                                onChange={handleSettingsChange(
                                                    setting.globalIndex,
                                                )}
                                                disabled={isAlarm}
                                            />
                                        </div>
                                        <div
                                            className={classNames(
                                                styles.nonDefaultValue,
                                                isSameAsDefault ||
                                                    !isSienciMachine
                                                    ? styles.hide
                                                    : null,
                                            )}
                                        >
                                            <Tooltip
                                                content={`Default Value: ${defaultValue}`}
                                            >
                                                <i
                                                    className="fas fa-info-circle"
                                                    style={{
                                                        marginRight: '1rem',
                                                    }}
                                                />
                                            </Tooltip>

                                            <Tooltip
                                                content={`Reset this setting to the default value (${defaultValue})`}
                                            >
                                                <button
                                                    type="button"
                                                    style={{ all: 'unset' }}
                                                    onClick={handleResetToDefaultValue(
                                                        setting.setting,
                                                    )}
                                                    disabled={isAlarm}
                                                >
                                                    <FaUndo className="w-6 h-6" />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className={styles['no-settings-wrapper']}>
                            <h5>
                                No Settings Found, Please Refine Your Search
                            </h5>
                            <Button onClick={() => setFilterText('')}>
                                Clear Search Text
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default connect((store) => {
    const descriptions = get(store, 'controller.settings.descriptions', {});
    const isAlarm =
        get(store, 'controller.state.status.activeState') ===
        GRBL_ACTIVE_STATE_ALARM;

    return {
        descriptions,
        isAlarm,
    };
})(HalSettings);
