/* eslint-disable react/button-has-type */
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import styles from './index.styl';

const NavSidebarLink = ({ label, url = '#', icon, onClick, className }) => {
    return (
        <button
            onClick={onClick}
            className={cx(styles.linkButton, className)}
        >
            <i className={`fa fas ${icon}`} /> {label}
        </button>
    );
};

NavSidebarLink.propTypes = {
    label: PropTypes.string.isRequired,
    url: PropTypes.string,
    icon: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    className: PropTypes.string
};

export default NavSidebarLink;
