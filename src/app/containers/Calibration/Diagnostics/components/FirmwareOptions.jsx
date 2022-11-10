/*
 * Copyright (C) 2022 Sienci Labs Inc.
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
import cx from 'classnames';
import generateSupportFile from 'app/lib/diagnostics';
import styles from '../index.styl';


const DiagnosticFile = () => {
    return (
        <div className={cx(styles.card)}>
            <h2>Diagnostic File</h2>
            {
                //<button onClick={() => generateSupportFile()}>Generate Diagnostic File</button>
            }
            { generateSupportFile() }
            <div className={styles.small}>This creates a shareable PDF file with information on your gSender setup, your machine, and the currently loaded file if applicable</div>
        </div>
    );
};

export default DiagnosticFile;
