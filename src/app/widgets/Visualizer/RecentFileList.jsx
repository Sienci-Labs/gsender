import React from 'react';
import cx from 'classnames';
import { loadRecentFile } from './ClientRecentFiles';
import styles from './RecentFileList.styl';

const RecentFileList = ({ visible, recentFiles, setShowPullout }) => {
    return (
        <div className={cx({ [styles.hidden]: !visible })}>
            <div className={cx(styles.recentFileList)}>
                <h2>Recent Files</h2>
                {
                    recentFiles.map(recentFile => {
                        const date = new Date(recentFile.timeUploaded).toLocaleDateString();
                        return (
                            <button
                                key={recentFile.filePath}
                                className={styles.recentFile}
                                onClick={() => loadRecentFile(recentFile.filePath) && setShowPullout(false)}
                                title={`${recentFile.filePath} - Loaded ${date}`}
                            >
                                <span>{recentFile.fileName}</span>
                            </button>
                        );
                    })
                }
            </div>
        </div>

    );
};

export default RecentFileList;
