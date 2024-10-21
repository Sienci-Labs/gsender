import { useRef, useEffect, useState } from 'react';
import { FaFolderOpen } from 'react-icons/fa';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { FaRedo } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import isElectron from 'is-electron';
import pubsub from 'pubsub-js';
import debounce from 'lodash/debounce';

import { Button } from 'app/components/shadcn/Button';
import { store as reduxStore } from 'app/store/redux';
import store from 'app/store';
import controller from 'app/lib/controller';
import api from 'app/api';
import { VISUALIZER_PRIMARY } from 'app/constants';
import { unloadFileInfo } from 'app/store/redux/slices/fileInfo.slice';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from 'app/components/shadcn/Dropdown';
import { getRecentFiles } from './utils/recentfiles';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

const ButtonControlGroup = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const { fileLoaded, path } = useTypedSelector((state) => state.file);

    useEffect(() => {
        setRecentFiles(getRecentFiles());
        pubsub.subscribe((msg, files) => {
            setRecentFiles(files);
        }, 'recentFiles');
    }, []);

    const handleLoadFile = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = event.target.files;
        const file = files[0];

        const formData = new FormData();
        formData.append('gcode', file);
        formData.append('port', controller.port);
        formData.append('visualizer', VISUALIZER_PRIMARY);

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
        await api.file.upload(formData);
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

    const handleReloadFile = debounce(() => {
        if (!fileLoaded) {
            return;
        }

        (window as any).ipcRenderer?.send('load-recent-file', {
            filePath: path,
        });
    }, 300);

    const handleCloseFile = () => {
        controller.command('gcode:unload');
        reduxStore.dispatch(unloadFileInfo());
        pubsub.publish('unload:file');
    };

    return (
        <div className="relative w-full flex justify-center">
            <div className="flex border-blue-500 border-2 rounded-md absolute top-[-35px] bg-white shadow-md z-50">
                <Button
                    type="button"
                    className="border-r-2 rounded-none border-blue-500 flex gap-2 text-base hover:bg-blue-100 transition-colors duration-200"
                    onClick={handleClickLoadFile}
                >
                    <FaFolderOpen className="w-6 h-6" /> Load File
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="border-r-2 rounded-none border-blue-500 px-1 hover:bg-blue-100 transition-colors duration-200">
                            <MdKeyboardArrowDown className="w-10 h-10" />
                        </Button>
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

                <Button
                    className="border-r-2 rounded-none border-blue-500 px-3 hover:bg-blue-100 transition-colors duration-200"
                    onClick={handleReloadFile}
                >
                    <FaRedo className="w-5 h-5" />
                </Button>

                <Button
                    className="rounded-none px-2 hover:bg-blue-100 transition-colors duration-200"
                    onClick={handleCloseFile}
                >
                    <MdClose className="w-8 h-8" />
                </Button>

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
