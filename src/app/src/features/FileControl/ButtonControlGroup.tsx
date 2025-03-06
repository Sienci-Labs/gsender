import { useRef, useEffect, useState } from 'react';
import { FaFolderOpen } from 'react-icons/fa';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { FaRedo } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import isElectron from 'is-electron';
import pubsub from 'pubsub-js';
import debounce from 'lodash/debounce';

import { Button } from 'app/components/Button';
import { store as reduxStore } from 'app/store/redux';
import store from 'app/store';
import controller from 'app/lib/controller';
import { VISUALIZER_PRIMARY } from 'app/constants';
import { unloadFileInfo } from 'app/store/redux/slices/fileInfo.slice';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from 'app/components/shadcn/Dropdown';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from 'app/components/shadcn/AlertDialog';

import { getRecentFiles } from './utils/recentfiles';
import { useRegisterShortcut } from '../Keyboard/useRegisterShortcut';
import { ReloadFileAlert } from 'app/features/FileControl/components/ReloadFileAlert.tsx';

const ButtonControlGroup = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const { fileLoaded, path } = useTypedSelector((state) => state.file);

    const usingElectron = isElectron();

    useEffect(() => {
        setRecentFiles(getRecentFiles());
        const token = pubsub.subscribe(
            'recentFiles',
            (_: string, files: string[]) => {
                setRecentFiles(files);
            },
        );
        return () => {
            pubsub.unsubscribe(token);
        };
    }, []);

    useRegisterShortcut({
        id: 'load-file',
        title: 'Load File',
        description: 'Load a file',
        defaultKeys: 'shift+l',
        category: 'CARVING_CATEGORY',
        onKeyDown: () => {
            handleClickLoadFile();
        },
    });

    useRegisterShortcut({
        id: 'unload-file',
        title: 'Unload File',
        description: 'Unload a file',
        defaultKeys: 'shift+k',
        category: 'CARVING_CATEGORY',
        onKeyDown: () => {
            handleCloseFile();
        },
    });

    const handleLoadFile = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = event.target.files;
        const file = files[0];

        const hooks = store.get('workspace.toolChangeHooks', {});
        const toolChangeOption = store.get(
            'workspace.toolChangeOption',
            'Ignore',
        );
        const toolChangeContext = {
            ...hooks,
            toolChangeOption,
        };

        controller.command('toolchange:context', toolChangeContext);
        await uploadGcodeFileToServer(
            file,
            controller.port,
            VISUALIZER_PRIMARY,
        );
    };

    const handleClickLoadFile = () => {
        if (isElectron()) {
            (window as any).ipcRenderer?.send('open-upload-dialog');
        } else {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
            }
        }
    };

    const handleLoadRecentFile = (filePath: string) => {
        (window as any).ipcRenderer?.send('load-recent-file', { filePath });
    };

    const handleFileReload = debounce(() => {
        if (!fileLoaded) {
            return;
        }

        (window as any).ipcRenderer?.send('load-recent-file', {
            filePath: path,
        });
    }, 300);

    const handleCloseFile = debounce(() => {
        if (!fileLoaded) {
            return;
        }

        controller.command('gcode:unload');
        reduxStore.dispatch(unloadFileInfo());
        pubsub.publish('unload:file');

        fileInputRef.current.value = '';
    }, 100);

    return (
        <div className="relative w-full flex justify-center">
            <div className="flex rounded-md absolute top-[-35px] bg-white shadow-md z-50 border-blue-500 border-2 overflow-hidden">
                <div className="border-r-2 border-blue-500 hover:bg-blue-50 transition-colors group">
                    <Button
                        onClick={handleClickLoadFile}
                        icon={
                            <FaFolderOpen className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
                        }
                        text="Load File"
                        variant="ghost"
                        className="h-10 px-4"
                    />
                </div>

                <div className="border-r-2 border-blue-500 hover:bg-blue-50 transition-colors group">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                icon={
                                    <MdKeyboardArrowDown className="w-10 h-8 group-hover:text-blue-600 transition-colors" />
                                }
                                variant="ghost"
                                className="h-10 w-12"
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-white">
                            <DropdownMenuLabel>Recent Files</DropdownMenuLabel>
                            {recentFiles.map((file) => (
                                <DropdownMenuItem
                                    key={file.filePath}
                                    onClick={() =>
                                        handleLoadRecentFile(file.filePath)
                                    }
                                    className="flex items-center hover:bg-blue-100 transition-colors duration-200 cursor-pointer"
                                >
                                    <div className="w-full overflow-hidden">
                                        <span
                                            className="block truncate"
                                            title={file.fileName}
                                        >
                                            {file.fileName}
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="border-r-2 border-blue-500 hover:bg-blue-50 transition-colors group">
                    <ReloadFileAlert
                        fileLoaded={fileLoaded && usingElectron}
                        handleFileReload={handleFileReload}
                    />
                </div>

                <div className="hover:bg-blue-50 transition-colors group">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                icon={
                                    <MdClose className="w-6 h-6 group-hover:text-blue-600 transition-colors" />
                                }
                                variant="ghost"
                                className="h-10 w-12"
                                disabled={!fileLoaded}
                            />
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will close the current file. Any
                                    unsaved changes will be lost.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCloseFile}>
                                    Close File
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple={false}
                    onChange={handleLoadFile}
                    accept=".gcode,.gc,.nc,.tap,.cnc"
                    id="fileInput"
                />
            </div>
        </div>
    );
};

export default ButtonControlGroup;
