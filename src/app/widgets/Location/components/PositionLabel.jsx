import PropTypes from 'prop-types';
import React from 'react';

import { PRIMARY_COLOR, SECONDARY_COLOR } from '../constants';

const PositionLabel = ({ value, small }) => {
    value = String(value);
    return (
        <div style={{ fontFamily: 'Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Bitstream Vera Sans Mono",  Monaco, "Courier New", Courier, monospace',
            fontSize: small ? '14px' : '2rem',
            padding: '0px 5px',
            textAlign: 'center',
            color: small ? SECONDARY_COLOR : PRIMARY_COLOR,
            fontWeight: small ? '400' : 'bold' }}
        >
            <span>{value.split('.')[0]}</span>
            <span>.</span>
            <span>{value.split('.')[1]}</span>
        </div>
    );
};

PositionLabel.propTypes = {
    value: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
    small: PropTypes.bool,
};

export default PositionLabel;
