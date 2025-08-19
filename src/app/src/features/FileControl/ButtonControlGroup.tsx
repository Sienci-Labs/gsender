import { useRef, useEffect, useState } from 'react';
import { FaFolderOpen } from 'react-icons/fa';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { MdClose } from 'react-icons/md';
import isElectron from 'is-electron';
import pubsub from 'pubsub-js';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

import { Button } from 'app/components/Button';
import { RootState, store as reduxStore } from 'app/store/redux';
import store from 'app/store';
import controller from 'app/lib/controller';
import {
    CARVING_CATEGORY,
    VISUALIZER_PRIMARY,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
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
import { ReloadFileAlert } from 'app/features/FileControl/components/ReloadFileAlert.tsx';
import { RecentFile } from './definitions';
import Divider from './components/Divider';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import { updateToolchangeContext } from 'app/features/Helper/Wizard.tsx';
import { useSelector } from 'react-redux';
import { toast } from 'app/lib/toaster';
import { get } from 'lodash';

const ButtonControlGroup = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileLoadedRef = useRef(false);
    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
    const { fileLoaded, path, name } = useTypedSelector((state) => state.file);

    useEffect(() => {
        fileLoadedRef.current = fileLoaded;
    }, [fileLoaded]);

    const usingElectron = isElectron();
    // const connected = useSelector(
    //     (state: RootState) => state.connection.isConnected,
    // );
    const workflowState = useSelector(
        (state: RootState) => state.controller.workflow.state,
    );
    const isRunning = workflowState === WORKFLOW_STATE_RUNNING;
    const canClick = !isRunning;

    useEffect(() => {
        setRecentFiles(getRecentFiles());
        const token = pubsub.subscribe(
            'recent-files-updated',
            (_: string, files: RecentFile[]) => {
                setRecentFiles(files);
            },
        );
        // Always update context on store change so latest config is present
        store.on('change', () => {
            updateToolchangeContext();
        });

        return () => {
            pubsub.unsubscribe(token);
        };
    }, []);

    const canRunShortcut = () => {
        const workflowState = get(
            reduxStore.getState(),
            'controller.workflow.state',
        );
        return workflowState !== WORKFLOW_STATE_RUNNING;
    };

    const shuttleControlEvents = {
        LOAD_FILE: {
            title: 'Load file',
            keys: ['shift', 'l'].join('+'),
            gamepadKeys: '0',
            keysName: 'A',
            cmd: 'LOAD_FILE',
            preventDefault: false,
            isActive: true,
            category: CARVING_CATEGORY,
            callback: throttle(
                () => {
                    if (!canRunShortcut()) {
                        return;
                    }
                    handleClickLoadFile();
                },
                300,
                { leading: true, trailing: false },
            ),
        },
        UNLOAD_FILE: {
            title: 'Unload file',
            keys: ['shift', 'k'].join('+'),
            gamepadKeys: '1',
            keysName: 'B',
            cmd: 'UNLOAD_FILE',
            preventDefault: false,
            isActive: true,
            category: CARVING_CATEGORY,
            callback: () => {
                if (!fileLoadedRef.current || !canRunShortcut()) {
                    return;
                }
                controller.command('gcode:unload');
                reduxStore.dispatch(unloadFileInfo());
                pubsub.publish('unload:file');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    const handleLoadFile = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = event.target.files;
        const file = files[0];

        updateToolchangeContext();

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

        if (
            name === 'gSender_Surfacing.gcode' ||
            name === 'gSender_Rotary_Surfacing'
        ) {
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
        toast('G-code File Closed', { position: 'bottom-right' });

        fileInputRef.current.value = '';
    }, 100);

    return (
        <div className="relative w-full flex justify-center">
            <div className="flex rounded-md absolute top-[-35px] bg-white dark:bg-dark shadow-md z-40 border-blue-500 border-2 overflow-hidden h-12 max-xl:h-11">
                <Button
                    onClick={handleClickLoadFile}
                    icon={<FaFolderOpen className="w-5 h-5" />}
                    text="Load File"
                    variant="ghost"
                    disabled={!canClick}
                    className="h-full px-4 rounded-none"
                />
                <Divider />
                <div className="grid grid-cols-[60px_2px_60px_2px_60px] h-full">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                icon={
                                    <MdKeyboardArrowDown className="w-10 h-8" />
                                }
                                variant="ghost"
                                disabled={!canClick}
                                className="h-full rounded-none"
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
                                    className="flex items-center hover:bg-blue-100 transition-colors duration-200 cursor-pointer dark:hover:bg-dark-lighter"
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

                    <Divider />

                    <ReloadFileAlert
                        fileLoaded={canClick && fileLoaded && usingElectron}
                        handleFileReload={handleFileReload}
                    />

                    <Divider />

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                icon={<MdClose className="w-6 h-6" />}
                                variant="ghost"
                                className="h-full rounded-none"
                                disabled={isRunning || !fileLoaded}
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
        </div>
    );
};

export default ButtonControlGroup;
