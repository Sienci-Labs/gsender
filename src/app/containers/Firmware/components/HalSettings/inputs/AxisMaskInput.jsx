import React from 'react';
import BitfieldInput from 'Containers/Firmware/components/HalSettings/inputs/BitfieldInput';

const AxisMaskInput = ({ info, setting, onChange }) => {
    return (
        <>
            <BitfieldInput info={info} setting={setting} onChange={onChange} externalFormat={['X', 'Y', 'Z', 'A']} />
        </>
    );
};

export default AxisMaskInput;
