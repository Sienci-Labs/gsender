import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { useState } from 'react';
import controller from 'app/lib/controller.ts';

export function useSDCard() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const isMounted = useTypedSelector(
        (state: RootState) => state.controller.sdcard?.isMounted,
    );
    const files = useTypedSelector(
        (state: RootState) => state.controller.sdcard?.files,
    );

    const uploadFileToSDCard = (files) => {
        console.log('uploading file to SD card');
    };

    const runSDFile = (path) => {
        console.log(path);
        console.log('running SD file');
        controller.command('sdcard:run', path);
    };

    const deleteSDCard = (path) => {
        console.log(path);
        console.log('deleting file from SD card');
    };

    console.log(isMounted, files);
    return {
        isMounted: true,
        files,
        isLoading,
        setIsLoading,
        uploadFileToSDCard,
        runSDFile,
        deleteSDCard,
    };
}
