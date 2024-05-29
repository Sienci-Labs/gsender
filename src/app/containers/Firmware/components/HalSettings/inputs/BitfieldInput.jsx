import React, { useEffect, useState } from 'react';
import ToggleSwitch from 'Components/ToggleSwitch';
import ensureArray from 'ensure-array';
import styles from './index.styl';
import { convertBitfieldToValue, getBitfieldArr } from 'Containers/Firmware/components/HalSettings/inputs/utils';

const BitfieldInput = ({ info, setting, onChange, externalFormat = null, isExclusive = false, disabled }) => {
    let { format } = info;
    format = ensureArray(format);

    // Check for external format override for AM and use that instead
    if (externalFormat) {
        format = ensureArray(externalFormat);
    }
    const [bitMap, setBitMap] = useState([]);

    useEffect(() => {
        let map = getBitfieldArr(setting.value);
        setBitMap(map);
    }, [setting]);

    const onToggleOpt = (checked, e, id) => {
        const index = document.getElementById(id).value;

        let curValue = bitMap[index];
        curValue = curValue === 1 ? 0 : 1;
        const newMap = [...bitMap];
        newMap[index] = curValue;
        setBitMap(newMap);
        const intValue = convertBitfieldToValue(newMap);
        onChange(intValue);
        // Also change number value :)
    };

    return (
        <div className={styles.column}>
            {
                format.map((opt, index) => {
                    let key = `${setting.setting}-${index}-key`;
                    const notNA = opt !== 'N/A';
                    let checked = bitMap[index] === 1;
                    let isDisabled = disabled || ((index > 0) && isExclusive && bitMap[0] !== 1);
                    const id = `${setting.setting}-${index}-key`;
                    return notNA && (
                        <div className={styles.row} key={key}>
                            <div>{opt}: </div>
                            <div>
                                <ToggleSwitch
                                    id={id}
                                    onChange={onToggleOpt}
                                    checked={checked}
                                    value={index}
                                    disabled={isDisabled}
                                />
                            </div>
                        </div>
                    );
                })
            }
        </div>
    );
};

export default BitfieldInput;
