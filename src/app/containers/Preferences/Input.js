import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './index.styl';

const Input = ({ value, label, units, onChange, additionalProps }) => {
    return (
        <div className={classNames(styles.input, 'form-group')}>
            <label htmlFor="">{`${label}`}</label>
            <div className="input-group">
                <input
                    {...additionalProps}
                    value={value}
                    onChange={onChange}
                    className="form-control"
                    style={{ zIndex: '0', fontSize: '20px', textAlign: 'center', color: '#3e85c7' }}
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
};

Input.defaultProps = {
    additionalProps: { type: 'text' },
};

export default Input;
