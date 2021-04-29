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
            tabIndex={0}
        >
            <i className="fas fa-chevron-right" />
            <RecentFileList visible={showPullout} recentFiles={recentFiles} setShowPullout={setShowPullout} />
        </div>
    );
};

export default RecentFileButton;
