import { useRef } from 'react';
import { FaFolderOpen } from 'react-icons/fa';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { FaRedo } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import isElectron from 'is-electron';
import pubsub from 'pubsub-js';

import { Button } from 'app/components/shadcn/Button';
import { store as reduxStore } from 'app/store/redux';
import store from 'app/store';
import controller from 'app/lib/controller';
import api from 'app/api';
import { VISUALIZER_PRIMARY } from 'app/constants';
import { unloadFileInfo } from 'app/store/redux/slices/fileInfo.slice';

const ButtonControlGroup = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleLoadRecentFiles = () => {
        console.log('Load Recent Files');
    };

    const handleReloadFile = () => {
        console.log('Reload Files');
    };

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

                <Button
                    className="border-r-2 rounded-none border-blue-500 px-1 hover:bg-blue-100 transition-colors duration-200"
                    onClick={handleLoadRecentFiles}
                >
                    <MdKeyboardArrowDown className="w-10 h-10" />
                </Button>

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
