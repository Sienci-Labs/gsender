import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { useEffect, useState } from 'react';
import controller from 'app/lib/controller.ts';

export type UploadState = 'idle' | 'uploading' | 'complete';

export function useSDCard() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    useEffect(() => {
        controller.addListener('ymodem:start', () => {
            setUploadProgress(0);
            setUploadState('uploading');
        });
        controller.addListener('ymodem:complete', () => {
            setUploadState('complete');
            setTimeout(() => {
                setUploadState('idle');
            }, 1000);
        });
        controller.addListener('ymodem:progress', (prog) => {
            setUploadProgress(prog);
        });
    }, []);
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
        uploadState,
        uploadProgress,
    };
}
