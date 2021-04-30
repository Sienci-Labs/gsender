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

import React from 'react';
import PropTypes from 'prop-types';

const Space = ({ tag: Component, width, height, ...props }) => {
    if ((typeof width === 'string') && width.match(/^\d+$/)) {
        width += 'px';
    }
    if ((typeof height === 'string') && height.match(/^\d+$/)) {
        height += 'px';
    }

    props.style = {
        display: 'inline-block',
        ...props.style,
    };

    if (width !== undefined) {
        props.style.width = width;
    }

    if (height !== undefined) {
        props.style.height = height;
    }

    return (
        <Component {...props} />
    );
};

Space.propTypes = {
    tag: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.string
    ]),
    width: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
    height: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
};

Space.defaultProps = {
    tag: 'div',
    width: 0,
    height: 0,
};

export default Space;
