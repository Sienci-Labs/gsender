import React from 'react';

import BitfieldInput from 'Containers/Firmware/components/HalSettings/inputs/BitfieldInput';

// We can just wrap the working bitfield with the isExclusive tag
const ExclusiveBitfieldInput = ({ info, setting, onChange, disabled }) => {
    return (
        <>
            <BitfieldInput info={info} onChange={onChange} setting={setting} isExclusive={true} disabled={disabled} />
        </>
    );
};

export default ExclusiveBitfieldInput;
