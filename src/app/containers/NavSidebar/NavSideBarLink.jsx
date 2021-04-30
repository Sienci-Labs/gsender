/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

/* eslint-disable react/button-has-type */
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import styles from './index.styl';

const NavSidebarLink = ({ label, url = '#', icon, onClick, className, disabled = false }) => {
    return (
        <button
            onClick={onClick}
            className={cx(styles.linkButton, className)}
            disabled={disabled}
        >
            <i className={`${icon}`} /> {label}
        </button>
    );
};

NavSidebarLink.propTypes = {
    label: PropTypes.string.isRequired,
    url: PropTypes.string,
    icon: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    className: PropTypes.string,
    disabled: PropTypes.bool
};

export default NavSidebarLink;
