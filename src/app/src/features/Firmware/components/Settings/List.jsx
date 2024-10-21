import React, { useContext } from 'react';
import classname from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';

import Tooltip from 'app/components/Tooltip';
import Button from 'app/components/Button';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import CategoryTag from './CategoryTag';
import InputController from './input';
import { FirmwareContext, restoreSingleDefaultSetting } from '../../utils';
import { GRBL_ACTIVE_STATE_ALARM } from '../../../../constants';
import styles from '../../index.module.styl';

const SettingsList = ({ firmwareType, isAlarm }) => {
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

    const handleResetToDefaultValue = (setting) => (event) => {
        Confirm({
            title: 'Reset Single EEPROM Value',
            content: 'Are you sure you want to reset this value to default?',
            confirmLabel: 'Yes',
            onConfirm: () => {
                restoreSingleDefaultSetting(setting, machineProfile);
            },
        });
    };

    return (
        <div className={styles.settingsContainer}>
            <div className={styles.tableHeader}>
                <div
                    className={[
                        styles['non-default-value'],
                        styles.tableColumnEEPROM,
                    ].join(' ')}
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
                        settings.map((grbl, index) => {
                            const [, defaultValue] =
                                Object.entries(
                                    machineProfile?.eepromSettings ?? {},
                                ).find(([key]) => key === grbl.setting) ?? [];
                            const isSameAsDefault = defaultValue === grbl.value;
                            const labelMap = { 0: 'Disabled', 1: 'Enabled' };
                            const defaultValueLabel =
                                grbl.inputType === 'switch'
                                    ? labelMap[defaultValue]
                                    : defaultValue;
                            const isSienciMachine =
                                machineProfile?.company?.includes(
                                    'Sienci Labs',
                                );
                            const highlighted =
                                !isSameAsDefault && isSienciMachine
                                    ? { backgroundColor: '#f2f2c2' }
                                    : {};
                            const {
                                message = 'Custom EEPROM field',
                                description = `Change the value of ${grbl.setting}`,
                            } = grbl;

                            return (
                                <div
                                    key={grbl.setting}
                                    className={styles.containerFluid}
                                    style={highlighted}
                                >
                                    <div className={styles.tableRow}>
                                        <div className={styles.keyRow}>
                                            {grbl.setting.replace('$', '')}
                                            <CategoryTag
                                                category={grbl.category}
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
                                            <InputController
                                                title={grbl.setting}
                                                type={grbl.inputType}
                                                min={grbl.min}
                                                max={grbl.max}
                                                step={grbl.step}
                                                units={grbl.units}
                                                onChange={handleSettingsChange(
                                                    grbl.globalIndex,
                                                )}
                                                value={grbl.value}
                                                values={grbl.values}
                                                maxChars={grbl.maxChars}
                                                bits={grbl.bits}
                                                numBits={grbl.numBits}
                                                requiredBit={grbl.requiredBit}
                                                disabled={isAlarm}
                                            />
                                        </div>

                                        <div
                                            className={classname(
                                                styles.nonDefaultValue,
                                                isSameAsDefault ||
                                                    !isSienciMachine
                                                    ? styles.hide
                                                    : null,
                                            )}
                                        >
                                            <Tooltip
                                                content={`Default Value: ${defaultValueLabel}`}
                                            >
                                                <i
                                                    className="fas fa-info-circle"
                                                    style={{
                                                        marginRight: '1rem',
                                                    }}
                                                />
                                            </Tooltip>

                                            <Tooltip
                                                content={`Reset this setting to the default value (${defaultValueLabel})`}
                                            >
                                                <button
                                                    type="button"
                                                    style={{ all: 'unset' }}
                                                    onClick={handleResetToDefaultValue(
                                                        grbl.setting,
                                                    )}
                                                    disabled={isAlarm}
                                                >
                                                    <i
                                                        className="fas fa-undo"
                                                        style={{
                                                            cursor: 'pointer',
                                                        }}
                                                    />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className={styles.noSettingsWrapper}>
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
    const firmwareType = get(store, 'controller.type');
    const isAlarm =
        get(store, 'controller.state.status.activeState') ===
        GRBL_ACTIVE_STATE_ALARM;

    return {
        firmwareType,
        isAlarm,
    };
})(SettingsList);
