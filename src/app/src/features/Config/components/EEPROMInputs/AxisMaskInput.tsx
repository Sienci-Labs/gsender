import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';
import BitfieldInput from './BitfieldInput';

const AxisMaskInput = ({ info, setting, onChange, axes, disabled }) => {
    return (
        <>
            <BitfieldInput
                info={info}
                setting={setting}
                onChange={onChange}
                externalFormat={axes}
                disabled={disabled}
            />
        </>
    );
};

export default connect((store) => {
    const axes = get(store, 'controller.state.axes.axes', ['X', 'Y', 'Z']);
    return {
        axes,
    };
})(AxisMaskInput);
