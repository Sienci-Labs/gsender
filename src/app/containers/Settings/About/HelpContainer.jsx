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
import i18n from 'app/lib/i18n';
import styles from './index.styl';

const HelpContainer = () => {
    return (
        <div className={styles.helpContainer}>
            <button
                type="button"
                className="btn btn-default"
                onClick={() => {
                    const url = 'https://github.com/cncjs/cncjs/releases';
                    window.open(url, '_blank');
                }}
            >
                {i18n._('Downloads')}
            </button>
            <button
                type="button"
                className="btn btn-default"
                onClick={() => {
                    const url = 'https://github.com/cncjs/cncjs/issues';
                    window.open(url, '_blank');
                }}
            >
                {i18n._('Report an issue')}
            </button>
        </div>
    );
};

export default HelpContainer;
