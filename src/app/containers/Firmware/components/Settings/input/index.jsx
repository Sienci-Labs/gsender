import React from 'react';
import PropTypes from 'prop-types';

import { GRBL_SETTINGS_INPUT_TYPES } from 'server/controllers/Grbl/constants';

import BitShiftInput from './BitShiftInput';
import Number from './Number';
import StatusReportSwitch from './StatusReportSwitch';
import Switch from './Switch';

const { NUMBER, MASK, MASK_STATUS_REPORT, SWITCH } = GRBL_SETTINGS_INPUT_TYPES;

const InputController = (props) => {
    switch (props.type) {
    case NUMBER: {
        return <Number {...props} />;
    }

    case SWITCH: {
        return <Switch {...props} />;
    }

    case MASK: {
        return <BitShiftInput {...props} />;
    }

    case MASK_STATUS_REPORT: {
        return <StatusReportSwitch {...props} />;
    }

    default: {
        return null;
    }
    }
};

InputController.propTypes = {
    type: PropTypes.oneOf(Object.values(GRBL_SETTINGS_INPUT_TYPES))
};

export default InputController;
