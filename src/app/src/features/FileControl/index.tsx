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
} from './utils/recentfiles';
import { toast } from 'app/lib/toaster';

type FileData = {
    data: string;
    name: string;
    path: string;
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
                        name: string;
                        fullPath: string;
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
                    };

                    handleElectronFileUpload(recentFile, true);
                },
            );
        }
    }, []);

    const handleElectronFileUpload = async (
        file: FileData,
        isRecentFile = false,
    ) => {
        const givenFile = new File([file.data], file.name);

        if (isElectron() && isRecentFile) {
            // Assuming these functions are imported or defined elsewhere
            const recentFile = createRecentFileFromRawPath(
                file.path,
                file.name,
            );
            addRecentFile(recentFile);
        }

        await uploadGcodeFileToServer(
            givenFile,
            controller.port,
            VISUALIZER_PRIMARY,
        );

        reduxStore.dispatch(updateFileInfo({ path: file.path }));
    };

    return (
        <Widget>
            <Widget.Content>
                <div className="w-full flex flex-col gap-2">
                    <ButtonControlGroup />

                    <FileInformation />
                </div>
            </Widget.Content>
        </Widget>
    );
};

export default FileControl;
