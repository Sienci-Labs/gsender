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
