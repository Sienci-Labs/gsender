import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { useState } from 'react';

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
        console.log('running SD file');
    };

    const deleteSDCard = (path) => {
        console.log('deleting file from SD card');
    };

    console.log(isMounted, files);
    return {
        isMounted,
        files,
        isLoading,
        setIsLoading,
        uploadFileToSDCard,
        runSDFile,
        deleteSDCard,
    };
}
