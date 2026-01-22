import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { useState } from 'react';
import controller from 'app/lib/controller.ts';

export type UploadState = 'idle' | 'uploading' | 'complete' | 'error';

export function useSDCard() {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const isMounted = useTypedSelector(
        (state: RootState) => state.controller.state.status?.sdCard,
    );
    const files = useTypedSelector(
        (state: RootState) => state.controller.sdcard?.files,
    );
    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
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
        isConnected,
        isMounted,
        files,
        isLoading,
        setIsLoading,
        uploadFileToSDCard,
        runSDFile,
        deleteSDCard,
    };
}
