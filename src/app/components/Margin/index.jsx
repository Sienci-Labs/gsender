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

import PropTypes from 'prop-types';
import React from 'react';

const Margin = ({ style, ...props }) => {
    style = { ...style };
    const { v = 0, h = 0, top = 0, right = 0, bottom = 0, left = 0, ...others } = { ...props };

    if (v > 0) {
        style.marginTop = v;
        style.marginBottom = v;
    }
    if (h > 0) {
        style.marginLeft = h;
        style.marginRight = h;
    }
    if (top > 0) {
        style.marginTop = top;
    }
    if (right > 0) {
        style.marginRight = right;
    }
    if (bottom > 0) {
        style.marginBottom = bottom;
    }
    if (left > 0) {
        style.marginLeft = left;
    }

    return (
        <div style={style} {...others} />
    );
};

Margin.propTypes = {
    v: PropTypes.number,
    h: PropTypes.number,
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number
};

export default Margin;
