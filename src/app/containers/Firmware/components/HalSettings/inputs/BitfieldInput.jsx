import React, { useEffect, useState } from 'react';
import ToggleSwitch from 'Components/ToggleSwitch';
import ensureArray from 'ensure-array';
import styles from './index.styl';
import { convertBitfieldToValue, getBitfieldArr } from 'Containers/Firmware/components/HalSettings/inputs/utils';

const BitfieldInput = ({ info, setting }) => {
    let { format } = info;
    format = ensureArray(format);
    const [bitMap, setBitMap] = useState([]);

    useEffect(() => {
        let map = getBitfieldArr(setting.value);
        setBitMap(map);
        console.log(map);
    }, []);

    const onToggleOpt = (checked, e, id) => {
        const index = document.getElementById(id).value;

        let curValue = bitMap[index];
        curValue = curValue === 1 ? 0 : 1;
        const newMap = [...bitMap];
        newMap[index] = curValue;
        setBitMap(newMap);
        const intValue = convertBitfieldToValue(newMap);
        console.log(intValue);
        // Also change number value :)
    };

    return (
        <div className={styles.column}>
            {
                format.map((opt, index) => {
                    let checked = bitMap[index] === 1;
                    const id = `${setting.setting}-${index}-key`;
                    return (
                        <div className={styles.row}>
                            <div>{opt}: </div>
                            <div><ToggleSwitch id={id} onChange={onToggleOpt} checked={checked} value={index}/></div>
                        </div>
                    );
                })
            }
        </div>
    );
};

export default BitfieldInput;
