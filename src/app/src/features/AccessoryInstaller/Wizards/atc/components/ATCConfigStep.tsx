import { useEffect, useRef, useState } from 'react';
import { StepProps } from 'app/features/AccessoryInstaller/types';
import controller from 'app/lib/controller.ts';
import { ConfigTab } from 'app/features/ATC/components/Configuration/components/ConfigTab.tsx';
import { ConfigProvider, useConfigContext } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';
import { repopulateFromSDCard } from 'app/features/ATC/components/Configuration/utils/ConfigUtils.ts';

const DEFAULT_UPLOAD_ERROR = 'SD card upload failed. Please try again.';

function getUploadErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
        const trimmedError = error.trim();
        if (trimmedError.length > 0) {
            return trimmedError;
        }
    }

    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message.trim();
    }

    if (error && typeof error === 'object') {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim().length > 0) {
            return message.trim();
        }
    }

    return DEFAULT_UPLOAD_ERROR;
}

function ATCConfigStepContent() {
    const { updateConfig, setStatus } = useConfigContext();
    const [uploading, setUploading] = useState(false);
    const updateConfigRef = useRef(updateConfig);
    const setStatusRef = useRef(setStatus);

    useEffect(() => {
        updateConfigRef.current = updateConfig;
        setStatusRef.current = setStatus;
    }, [setStatus, updateConfig]);

    useEffect(() => {
        const handleSdcardJson = (payload: { code?: string }) => {
            if (!payload?.code) {
                return;
            }

            const updatedConfig = repopulateFromSDCard(payload.code);
            updateConfigRef.current({
                variables: { ...updatedConfig.variables },
            });
        };
        const handleYmodemStart = () => setUploading(true);
        const handleYmodemComplete = () => {
            setUploading(false);
            setStatusRef.current({ type: 'idle', message: '' });
        };
        const handleYmodemError = (error: unknown) => {
            setUploading(false);
            setStatusRef.current({
                type: 'error',
                message: getUploadErrorMessage(error),
            });
        };

        controller.addListener('sdcard:json', handleSdcardJson);
        controller.addListener('ymodem:start', handleYmodemStart);
        controller.addListener('ymodem:complete', handleYmodemComplete);
        controller.addListener('ymodem:error', handleYmodemError);
        controller.command('sdcard:read', 'ATCI.macro');

        return () => {
            controller.removeListener('sdcard:json', handleSdcardJson);
            controller.removeListener('ymodem:start', handleYmodemStart);
            controller.removeListener('ymodem:complete', handleYmodemComplete);
            controller.removeListener('ymodem:error', handleYmodemError);
        };
    }, []);

    return <ConfigTab uploading={uploading} />;
}

export function ATCConfigStep(_props: StepProps) {
    return (
        <ConfigProvider>
            <ATCConfigStepContent />
        </ConfigProvider>
    );
}
