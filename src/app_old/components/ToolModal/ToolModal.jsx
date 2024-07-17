/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import React from 'react';
import PropTypes from 'prop-types';

import Modal from 'app/components/Modal';

import styles from './index.styl';
import { LARGE, MEDIUM, SMALL, XSMALL } from './sizings';


const ToolModal = ({ onClose, title, style, className, size, children, disableOverlayClick = false, ...rest }) => {
    let sizingStyles;

    switch (size?.toLowerCase()) {
    case 'xs':
        sizingStyles = XSMALL;
        break;
    case 'small':
    case 'sm':
        sizingStyles = SMALL;
        break;

    case 'medium':
    case 'md':
        sizingStyles = MEDIUM;
        break;

    case 'large':
    case 'lg':
        sizingStyles = LARGE;
        break;

    default: {
        sizingStyles = LARGE;
        break;
    }
    }

    return (
        <Modal
            onClose={onClose}
            className={className}
            style={{ ...style, ...sizingStyles }}
            size={size}
            disableOverlayClick={disableOverlayClick}
            {...rest}
        >
            <div className={styles.toolModal}>
                <div className={styles.header}>
                    <h5 className={styles.headerText}>{title}</h5>
                </div>
                <div className={styles.container}>
                    {children}
                </div>
            </div>
        </Modal>
    );
};

ToolModal.propTypes = {
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    size: PropTypes.string,
};

export default ToolModal;
