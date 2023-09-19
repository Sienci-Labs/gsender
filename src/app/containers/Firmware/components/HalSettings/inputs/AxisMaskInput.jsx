import React from 'react';
import BitfieldInput from 'Containers/Firmware/components/HalSettings/inputs/BitfieldInput';

const AxisMaskInput = ({ info, setting }) => {
    return (
        <>
            <BitfieldInput info={info} setting={setting} externalFormat={['X', 'Y', 'Z', 'A']} />
        </>
    );
};

export default AxisMaskInput;
