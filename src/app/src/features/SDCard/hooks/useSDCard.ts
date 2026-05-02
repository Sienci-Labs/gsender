import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import {useEffect, useState} from 'react';
import controller from 'app/lib/controller.ts';
import {WORKFLOW_STATE_IDLE} from "app/constants";

export type UploadState = 'idle' | 'uploading' | 'complete' | 'error';

export function useSDCard() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isWorkflowIdle, setIsWorkflowIdle] = useState<boolean>(false);
    const [isRunningSDFile, setIsRunningSDFile] = useState<boolean>(false);

    const isMounted = useTypedSelector(
        (state: RootState) => state.controller.state.status?.sdCard,
    );
    const files = useTypedSelector(
        (state: RootState) => state.controller.sdcard?.files,
    );
    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    // If we have a name, we a running a SD file - convert to boolean in following useEffect
    const sdRunReported = useTypedSelector((state: RootState) => state.controller.state.status?.SD?.name);
    useEffect(() => {
        if (sdRunReported !== null) {
            setIsRunningSDFile(true);
        } else {
            setIsRunningSDFile(false)
        }
    }, [sdRunReported]);

    const firmwareType = useTypedSelector(
        (state: RootState) => state.controller.type,
    );


    // Set/Check workflow state is idle for SD card actions
    const workflowState = useTypedSelector((state: RootState) => state.controller.workflow.state);
    useEffect(() => {
        setIsWorkflowIdle(workflowState === WORKFLOW_STATE_IDLE);
    }, [workflowState]);




    const newOpts = useTypedSelector(
        (state: RootState) => state.controller.settings.info?.NEWOPT,
    );
    const hasFTP =
        newOpts !== undefined &&
        Object.prototype.hasOwnProperty.call(newOpts, 'FTP');
    const hasYM =
        newOpts !== undefined &&
        Object.prototype.hasOwnProperty.call(newOpts, 'YM');

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
        firmwareType,
        hasFTP,
        hasYM,
        isRunningSDFile,
        isWorkflowIdle
    };
}
