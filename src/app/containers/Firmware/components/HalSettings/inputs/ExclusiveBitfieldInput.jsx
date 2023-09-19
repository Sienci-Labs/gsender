import React from 'react';

import BitfieldInput from 'Containers/Firmware/components/HalSettings/inputs/BitfieldInput';

// We can just wrap the working bitfield with the isExclusive tag
const ExclusiveBitfieldInput = ({ info, setting }) => {
    return (
        <>
            <BitfieldInput info={info} setting={setting} isExclusive={true} />
        </>
    );
};

export default ExclusiveBitfieldInput;
