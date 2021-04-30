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
import styles from '../index.styl';

const Tool = ({ metricDiameter, imperialDiameter, type, onDelete }) => {
    return (
        <div className={styles.tool}>
            <div className={styles.toolDimensions}>
                <div><b>{metricDiameter}</b>mm</div>
                <div><b>{imperialDiameter}</b>in</div>
            </div>
            <div>{type}</div>
            <button
                type="button"
                className={styles.delete}
                alt="Delete Tool"
                onClick={onDelete}
            >
                <i className="far fa-trash-alt" />
            </button>

        </div>
    );
};

export default Tool;
