import { ReactNode, useEffect, useRef } from 'react';
import { StepProps } from 'app/features/AccessoryInstaller/types';
import controller from 'app/lib/controller.ts';
import {
    ConfigProvider,
    useConfigContext,
} from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';
import { repopulateFromSDCard } from 'app/features/ATC/components/Configuration/utils/ConfigUtils.ts';
import {
    TemplateManagerListContent,
    TemplateManagerMainContent,
    TemplateManagerProvider,
} from 'app/features/ATC/components/Configuration/components/TemplatesTab.tsx';

function TemplateManagerSyncListener() {
    const { setTemplates, updateConfig } = useConfigContext();
    const updateConfigRef = useRef(updateConfig);
    const setTemplatesRef = useRef(setTemplates);

    useEffect(() => {
        updateConfigRef.current = updateConfig;
        setTemplatesRef.current = setTemplates;
    }, [setTemplates, updateConfig]);

    useEffect(() => {
        const handleSdcardJson = (payload: { code?: string }) => {
            if (!payload?.code) {
                return;
            }

            try {
                const updatedConfig = repopulateFromSDCard(payload.code);
                updateConfigRef.current({
                    variables: { ...updatedConfig.variables },
                });
                setTemplatesRef.current(updatedConfig);
            } catch {
                // Ignore malformed controller payloads and keep current state.
            }
        };

        controller.addListener('sdcard:json', handleSdcardJson);
        controller.command('sdcard:read', 'ATCI.macro');

        return () => {
            controller.removeListener('sdcard:json', handleSdcardJson);
        };
    }, []);

    return null;
}

export function TemplateManagementContextProvider({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <ConfigProvider>
            <TemplateManagerProvider>
                <TemplateManagerSyncListener />
                {children}
            </TemplateManagerProvider>
        </ConfigProvider>
    );
}

export function TemplateManagementStep(_props: StepProps) {
    return <TemplateManagerMainContent />;
}

export function TemplateManagementSecondaryContent() {
    return <TemplateManagerListContent showUploadButton />;
}
