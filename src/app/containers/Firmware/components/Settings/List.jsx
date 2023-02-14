import React, { useContext } from 'react';

import Tooltip from 'app/components/TooltipCustom/ToolTip';
import Button from 'app/components/FunctionButton/FunctionButton';

import CategoryTag from './CategoryTag';
import InputController from './input';

import styles from '../../index.styl';
import { FirmwareContext } from '../../utils';


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

    return (
        <div className={styles.settingsContainer}>
            <div className={styles.tableHeader}>
                <div className={[styles['non-default-value'], styles.tableColumnEEPROM].join(' ')}>
                    <span style={{ paddingLeft: '25px', paddingRight: '5px' }}>$ Setting</span>
                </div>
                <div className={styles.tableColumn}>
                    <span>Description</span>
                </div>
                <div className={styles.tableColumn}>
                    <span>Value</span>
                </div>
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
                                            {
                                                (isSameAsDefault || !isSienciMachine)
                                                    ? <div />
                                                    : <div className={styles['non-default-value']}><Tooltip content={`Default Value: ${defaultValueLabel}`}><i className="fas fa-info-circle" /></Tooltip></div>
                                            }
                                            <div className={styles.settingsInformation}>
                                                <div className={styles.keyRow}>
                                                    {grbl.setting.replace('$', '')}
                                                    <CategoryTag category={grbl.category} />
                                                </div>
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
                                                    values={grbl.values}
                                                    maxChars={grbl.maxChars}
                                                    bits={grbl.bits}
                                                    numBits={grbl.numBits}
                                                    requiredBit={grbl.requiredBit}
                                                />
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
