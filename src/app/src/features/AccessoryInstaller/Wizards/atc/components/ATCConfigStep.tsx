import { useEffect, useRef, useState } from 'react';
import { StepProps } from 'app/features/AccessoryInstaller/types';
import controller from 'app/lib/controller.ts';
import { ConfigTab } from 'app/features/ATC/components/Configuration/components/ConfigTab.tsx';
import { ConfigProvider, useConfigContext } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';
import { repopulateFromSDCard } from 'app/features/ATC/components/Configuration/utils/ConfigUtils.ts';

function ATCConfigStepContent() {
    const { updateConfig } = useConfigContext();
    const [uploading, setUploading] = useState(false);
    const updateConfigRef = useRef(updateConfig);

    useEffect(() => {
        updateConfigRef.current = updateConfig;
    }, [updateConfig]);

    useEffect(() => {
        const handleSdcardJson = (payload) => {
            const updatedConfig = repopulateFromSDCard(payload.code);
            updateConfigRef.current({
                variables: { ...updatedConfig.variables },
            });
        };
        const handleYmodemStart = () => setUploading(true);
        const handleYmodemComplete = () => setUploading(false);
        const handleYmodemError = () => setUploading(false);

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
