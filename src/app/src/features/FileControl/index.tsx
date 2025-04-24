import { useEffect } from 'react';
import isElectron from 'is-electron';

import { Widget } from 'app/components/Widget';
import { store as reduxStore } from 'app/store/redux';
import controller from 'app/lib/controller';
import { VISUALIZER_PRIMARY } from 'app/constants';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';

import ButtonControlGroup from './ButtonControlGroup';
import FileInformation from './FileInformation';
import { updateFileInfo } from 'app/store/redux/slices/fileInfo.slice';
import {
    addRecentFile,
    createRecentFileFromRawPath,
    deleteRecentFile,
    loadRecentFile,
} from './utils/recentfiles';
import { toast } from 'app/lib/toaster';
import { RecentFile } from './definitions';

export type FileData = {
    data: string;
    name: string;
    path: string;
    dir: string;
    size: number;
};

const FileControl = () => {
    useEffect(() => {
        if (isElectron()) {
            (window as any).ipcRenderer.on(
                'returned-upload-dialog-data',
                (_: any, file: FileData) => {
                    handleElectronFileUpload(file);
                },
            );

            (window as any).ipcRenderer.on(
                'loaded-recent-file',
                (
                    _: any,
                    fileMetaData: {
                        result: string;
                        size: number;
                        name: string;
                        dir: string;
                        fullPath: any;
                    },
                ) => {
                    if (!fileMetaData) {
                        toast.error(
                            'Error loading recent file, it may have been deleted or moved to a different folder.',
                        );

                        return;
                    }

                    const recentFile = {
                        data: fileMetaData.result,
                        name: fileMetaData.name,
                        path: fileMetaData.fullPath,
                        size: fileMetaData.size,
                        dir: fileMetaData.dir,
                    };

                    handleElectronFileUpload(recentFile, true);
                },
            );
            (window as any).ipcRenderer.on(
                'remove-recent-file',
                (
                    _: any,
                    data: {
                        err: string;
                        path: string;
                    },
                ) => {
                    toast.error(data.err);

                    deleteRecentFile(data.path);
                },
            );
        }
    }, []);

    const handleElectronFileUpload = async (
        file: FileData,
        isRecentFile = false,
    ) => {
        const givenFile = new File([file.data], file.name);

        if (isElectron() && !isRecentFile) {
            const recentFile = createRecentFileFromRawPath(file);
            addRecentFile(recentFile);
        }

        await uploadGcodeFileToServer(
            givenFile,
            controller.port,
            VISUALIZER_PRIMARY,
        );

        reduxStore.dispatch(updateFileInfo({ path: file.path }));
    };

    const handleRecentFileUpload = async (file: RecentFile) => {
        loadRecentFile(file.filePath);
    };

    return (
        <Widget>
            <Widget.Content>
                <div className="w-full flex flex-col gap-2">
                    <ButtonControlGroup />
                    <FileInformation
                        handleRecentFileUpload={handleRecentFileUpload}
                    />
                </div>
            </Widget.Content>
        </Widget>
    );
};

export default FileControl;
