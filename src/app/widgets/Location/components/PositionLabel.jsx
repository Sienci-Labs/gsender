import PropTypes from 'prop-types';
import React from 'react';

const PositionLabel = ({ value, small }) => {
    value = String(value);
    return (
        <div style={{ fontSize: small ? 14 : 28, padding: 5, textAlign: 'center', color: small ? null : '#3E85C7', fontWeight: small ? '400' : 'bold' }}>
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
