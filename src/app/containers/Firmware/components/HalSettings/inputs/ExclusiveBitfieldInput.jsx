import React from 'react';

import BitfieldInput from 'Containers/Firmware/components/HalSettings/inputs/BitfieldInput';

// We can just wrap the working bitfield with the isExclusive tag
const ExclusiveBitfieldInput = ({ info, setting, onChange }) => {
    return (
        <>
            <BitfieldInput info={info} onChange={onChange} setting={setting} isExclusive={true} />
        </>
    );
};

export default ExclusiveBitfieldInput;
