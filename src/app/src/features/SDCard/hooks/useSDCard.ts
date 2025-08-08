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

    const uploadFileToSDCard = (file) => {
        controller.command('ymodem:upload', file);
    };

    const runSDFile = (path) => {
        controller.command('sdcard:run', path);
    };

    const deleteSDCard = (path) => {
        console.log('deleting file from SD card');
    };

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
