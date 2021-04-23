import React from 'react';
import PropTypes from 'prop-types';
import styles from '../index.styl';

const GoToButton = ({ onClick, disabled }) => {
    return (
        <button
            tabIndex={-1}
            disabled={disabled}
            onClick={onClick}
            onKeyDown={onClick}
            className={styles['go-to-button']}
        >
            Go to
        </button>
    );
};

GoToButton.propTypes = {
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
};

export default GoToButton;
