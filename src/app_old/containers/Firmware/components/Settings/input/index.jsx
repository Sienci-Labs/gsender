import React from 'react';
import PropTypes from 'prop-types';

import { GRBL_HAL_SETTINGS_INPUT_TYPES } from 'server/controllers/Grblhal/constants';

import BitShiftInput from './BitShiftInput';
import Number from './Number';
import StatusReportSwitch from './StatusReportSwitch';
import Switch from './Switch';
import Select from './Select';
import String from './String';
import Mask from './Mask';

const { NUMBER, AXIS_MASK, MASK_STATUS_REPORT, SWITCH, SELECT, STRING, MASK } = GRBL_HAL_SETTINGS_INPUT_TYPES;

const InputController = (props) => {
    switch (props.type) {
    case NUMBER: {
        return <Number {...props} />;
    }

    case SWITCH: {
        return <Switch {...props} />;
    }

    case AXIS_MASK: {
        return <BitShiftInput {...props} />;
    }

    case MASK_STATUS_REPORT: {
        return <StatusReportSwitch {...props} />;
    }

    case SELECT: {
        return <Select {...props} />;
    }

    case STRING: {
        return <String {...props} />;
    }

    case MASK: {
        return <Mask {...props} />;
    }

    default: {
        return <String {...props} />;
    }
    }
};

InputController.propTypes = {
    type: PropTypes.oneOf(Object.values(GRBL_HAL_SETTINGS_INPUT_TYPES))
};

export default InputController;
