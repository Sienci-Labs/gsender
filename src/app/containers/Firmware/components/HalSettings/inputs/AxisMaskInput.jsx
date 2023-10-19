import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';
import BitfieldInput from 'Containers/Firmware/components/HalSettings/inputs/BitfieldInput';

const AxisMaskInput = ({ info, setting, onChange, axes }) => {
    return (
        <>
            <BitfieldInput info={info} setting={setting} onChange={onChange} externalFormat={axes} />
        </>
    );
};

export default connect((store) => {
    const axes = get(store, 'controller.state.axes.axes', ['X', 'Y', 'Z']);
    return {
        axes
    };
})(AxisMaskInput);
