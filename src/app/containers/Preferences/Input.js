import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './index.styl';

const Input = ({ value, label, units, onChange, additionalProps, className }) => {
    return (
        <div className={classNames(styles.input, 'form-group', className)}>
            <label htmlFor="">{`${label}`}</label>
            <div className="input-group">
                <input
                    {...additionalProps}
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    style={{ zIndex: '0', fontSize: '1.7rem', textAlign: 'center', color: '#3e85c7' }}
                />
                {units && <span className="input-group-addon">{units}</span>}
            </div>
        </div>
    );
};

Input.propTypes = {
    label: PropTypes.string,
    units: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    additionalProps: PropTypes.object,
    className: PropTypes.string,
};

Input.defaultProps = {
    additionalProps: { type: 'text' },
};

export default Input;
