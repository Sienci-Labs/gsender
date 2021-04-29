import store from 'app/store';
import pubsub from 'pubsub-js';
import { TOASTER_DANGER, Toaster } from '../../lib/toaster/ToasterLib';

export const RECENT_FILE_LIMIT = 5;

export const recentFileExists = (filePath, recentFiles) => {
    const file = recentFiles.find((file) => file.filePath === filePath);
    return !!(file);
};

export const createRecentFile = ({ name, dir }) => {
    return {
        fileName: name,
        filePath: `${dir}\\${name}`,
        timeUploaded: Date.now()
    };
};

export const createRecentFileFromRawPath = (filePath, fileName) => {
    return {
        fileName: fileName,
        filePath: filePath,
        timeUploaded: Date.now()
    };
};

export const updateRecentFileDate = (filepath, recentFiles) => {
    recentFiles.forEach((recentFile) => {
        if (recentFile.filePath === filepath) {
            recentFile.timeUploaded = Date.now();
        }
    });
    return recentFiles;
};

export const addRecentFile = (fileMetaData) => {
    if (fileMetaData === null) {
        Toaster.pop({
            type: TOASTER_DANGER,
            msg: 'Unable to load file - file may have been moved or deleted.'
        });
        return;
    }
    const recentFiles = getRecentFiles();
    let sortedFiles;

    if (recentFileExists(fileMetaData.filePath, recentFiles)) {
        sortedFiles = updateRecentFileDate(fileMetaData.filePath, recentFiles);
        sortedFiles = sortRecentFiles(sortedFiles);
    } else {
        recentFiles.push(fileMetaData);
        sortedFiles = sortRecentFiles(recentFiles);
        sortedFiles = trimRecentFilesToLimit(sortedFiles);
    }
    updateStoredRecentFiles(sortedFiles);
    pubsub.publish('recent-files-updated', sortedFiles);
};

export const getRecentFiles = () => {
    return store.get('workspace.recentFiles', []);
};

export const updateStoredRecentFiles = (recentFiles) => {
    store.replace('workspace.recentFiles', recentFiles);
};

export const trimRecentFilesToLimit = (recentFiles, limit = RECENT_FILE_LIMIT) => {
    if (recentFiles.length > limit) {
        return recentFiles.slice(0, limit);
    }
    return recentFiles;
};

export const recentFileSortHandler = (a, b) => {
    return b.timeUploaded - a.timeUploaded;
};

export const sortRecentFiles = (recentFiles = []) => {
    return recentFiles.sort(recentFileSortHandler);
};

export const loadRecentFile = (filePath) => {
    window.ipcRenderer.send('load-recent-file', { filePath: filePath });
    return true;
};
