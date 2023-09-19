import React, { useState, useEffect } from 'react';
import { getBitfieldArr } from 'Containers/Firmware/components/HalSettings/inputs/utils';


const ExclusiveBitfieldInput = ({ info, setting }) => {
    const [bitMap, setBitMap] = useState([]);
    useEffect(() => {
        let map = getBitfieldArr(setting.value);
        setBitMap(map);
        console.log(bitMap);
    }, []);

    return (
        <div>
        </div>
    );
};

export default ExclusiveBitfieldInput;
