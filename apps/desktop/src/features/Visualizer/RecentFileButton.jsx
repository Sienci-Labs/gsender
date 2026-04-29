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

import React, { useState, useEffect } from 'react';
import pubsub from 'pubsub-js';
import styles from './RecentFileList.styl';
import RecentFileList from './RecentFileList';
import { getRecentFiles } from './ClientRecentFiles';

const RecentFileButton = () => {
    const [showPullout, setShowPullout] = useState(false);
    const [recentFiles, setRecentFiles] = useState([]);

    useEffect(() => {
        setRecentFiles(getRecentFiles());
        pubsub.subscribe((msg, files) => {
            setRecentFiles(files);
        });
    });

    const toggle = () => setShowPullout(!showPullout);

    return (
        <div
            role="button"
            aria-label="Recent Files"
            className={styles.recentFilesButton}
            onClick={toggle}
            onKeyDown={toggle}
            tabIndex={0}
        >
            <i className="fas fa-chevron-right" />
            <RecentFileList
                visible={showPullout}
                recentFiles={recentFiles}
                setShowPullout={setShowPullout}
            />
        </div>
    );
};

export default RecentFileButton;
