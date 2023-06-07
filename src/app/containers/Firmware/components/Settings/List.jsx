import React, { useContext } from 'react';
import classname from 'classnames';

import Tooltip from 'app/components/TooltipCustom/ToolTip';
import Button from 'app/components/FunctionButton/FunctionButton';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import CategoryTag from './CategoryTag';
import InputController from './input';
import { FirmwareContext, restoreSingleDefaultSetting } from '../../utils';

import styles from '../../index.styl';


const SettingsList = () => {
    const { hasSettings, machineProfile, settings, setFilterText, setSettings, setSettingsToApply } = useContext(FirmwareContext);

    const handleSettingsChange = (index) => (value) => {
        setSettingsToApply(true);
        setSettings(prev => {
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
            }
        });
    };

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
                hasSettings && (
                    <>
                        {
                            settings.length > 0 ? settings.map((grbl, index) => {
                                const [, defaultValue] = Object.entries(machineProfile?.eepromSettings ?? {})
                                    .find(([key]) => key === grbl.setting) ?? [];
                                const isSameAsDefault = defaultValue === grbl.value;
                                const labelMap = { '0': 'Disabled', '1': 'Enabled' };
                                const defaultValueLabel = grbl.inputType === 'switch' ? labelMap[defaultValue] : defaultValue;
                                const isSienciMachine = machineProfile?.company?.includes('Sienci Labs');
                                const highlighted = (!isSameAsDefault && isSienciMachine) ? { backgroundColor: '#f2f2c2' } : {};

                                return (
                                    <div key={grbl.setting} className={styles.containerFluid} style={highlighted}>
                                        <div className={styles.tableRow}>
                                            <div className={styles.keyRow}>
                                                {grbl.setting.replace('$', '')}
                                                <CategoryTag category={grbl.category} />
                                            </div>

                                            <div className={styles.settingsInformation}>
                                                <div className={styles.settingsDescription}>
                                                    <div className={styles.itemText}>{grbl.message}</div>
                                                    <div className={styles.descriptionRow}>{grbl.description}</div>
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
                                                    onChange={handleSettingsChange(index)}
                                                    value={grbl.value}
                                                />
                                            </div>

                                            <div className={classname(styles['non-default-value'], (isSameAsDefault || !isSienciMachine) ? styles.hide : null)}>
                                                <Tooltip content={`Default Value: ${defaultValueLabel}`}>
                                                    <i className="fas fa-info-circle" style={{ marginRight: '1rem' }} />
                                                </Tooltip>

                                                <Tooltip content={`Reset this setting to the default value (${defaultValueLabel})`}>
                                                    <button
                                                        type="button"
                                                        style={{ all: 'unset' }}
                                                        onClick={handleResetToDefaultValue(grbl.setting)}
                                                    >
                                                        <i className="fas fa-undo" style={{ cursor: 'pointer' }} />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </div>

                                    </div>
                                );
                            }) : (
                                <div className={styles.noSettingsWrapper}>
                                    <h5>No Settings Found, Please Refine Your Search</h5>
                                    <Button onClick={() => setFilterText('')}>Clear Search Text</Button>
                                </div>
                            )
                        }
                    </>
                )
            }
        </div>
    );
};

export default SettingsList;
