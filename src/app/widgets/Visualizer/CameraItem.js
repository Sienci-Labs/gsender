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
import cx from 'classnames';

import { Tooltip } from 'app/components/Tooltip';
import i18n from 'app/lib/i18n';

import styles from './camera-control-area.styl';

/**
 * Camera Item component used to allow changing camera angles
 * @param {String} image Given directory for icon image
 * @param {Function} changeCamera Function to change camera angle
 * @param {Object} tooltip Settings for the tooltip component
 * @param {Boolean} active Boolean value shoing whether this item is currently selected or not
 */
const CameraItem = ({ image, changeCamera, tooltip, active }) => {
    return (
        <Tooltip placement={tooltip.placement} content={i18n._(tooltip.text)} hideOnClick>
            <input
                type="image"
                src={image}
                alt=""
                onClick={changeCamera}
                className={cx(styles['camera-img'], active ? styles['camera-control-active'] : '')}
            />
        </Tooltip>
    );
};

CameraItem.propTypes = {
    image: PropTypes.string.isRequired,
    changeCamera: PropTypes.func,
    tooltip: PropTypes.object,
    active: PropTypes.bool,
};

export default CameraItem;
