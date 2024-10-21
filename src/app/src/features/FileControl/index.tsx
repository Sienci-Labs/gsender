import { useEffect } from 'react';
import isElectron from 'is-electron';

import { Widget } from 'app/components/Widget';
import api from 'app/api';
import { store as reduxStore } from 'app/store/redux';
import controller from 'app/lib/controller';
import { VISUALIZER_PRIMARY } from 'app/constants';

import ButtonControlGroup from './ButtonControlGroup';
import FileInformation from './FileInformation';
import { updateFileInfo } from 'app/store/redux/slices/fileInfo.slice';
import {
    addRecentFile,
    createRecentFileFromRawPath,
} from './utils/recentfiles';
import { Toaster, TOASTER_DANGER } from 'app/lib/toaster/ToasterLib';

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
                        Toaster.pop({
                            msg: 'Error loading recent file, it may have been deleted or moved to a different folder.',
                            type: TOASTER_DANGER,
                            duration: 5000,
                        });

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
        const formData = new FormData();
        formData.append('gcode', new File([file.data], file.name));
        formData.append('port', controller.port);
        formData.append('visualizer', VISUALIZER_PRIMARY);

        if (isElectron() && isRecentFile) {
            // Assuming these functions are imported or defined elsewhere
            const recentFile = createRecentFileFromRawPath(
                file.path,
                file.name,
            );
            addRecentFile(recentFile);
        }

        await api.file.upload(formData);
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
