import React from 'react';
import classnames from 'classnames';
import ToggleSwitch from 'react-switch';
import PropTypes from 'prop-types';

import styles from './index.styl';

const Switch = ({ label, checked, onChange, className, style, disabled }) => {
    return (
        <div className={classnames(styles['toggle-item'], className)} style={style}>
            {label && <span>{label}</span> }
            <ToggleSwitch
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                checkedIcon={false}
                uncheckedIcon={false}
                onColor="#295d8d"
                height={24}
                width={48}
            />
        </div>
    );
};

Switch.propTypes = {
    label: PropTypes.string,
    checked: PropTypes.bool.isRequired,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

Switch.defaultProps = {
    disabled: false,
};

export default Switch;
