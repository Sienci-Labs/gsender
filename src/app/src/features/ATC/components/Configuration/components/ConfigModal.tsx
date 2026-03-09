import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from 'app/components/shadcn/Dialog.tsx';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from 'app/components/shadcn/Tabs';
import { ConfigTab } from './ConfigTab';
import { TemplatesTab } from './TemplatesTab';
import controller from 'app/lib/controller.ts';
import { repopulateFromSDCard } from 'app/features/ATC/components/Configuration/utils/ConfigUtils.ts';
import { useConfigContext } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';

interface ConfigModalProps {
    open: boolean;
    uploading: boolean;
    uploadError?: string;
    onOpenChange: (open: boolean) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
    open,
    onOpenChange,
    uploading,
    uploadError,
}) => {
    const [activeTab, setActiveTab] = useState('config');
    const { updateConfig, setTemplates } = useConfigContext();
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
            const updatedConfig = repopulateFromSDCard(payload.code);
            updateConfigRef.current({
                variables: { ...updatedConfig.variables },
            });
            setTemplatesRef.current(updatedConfig);
        };

        controller.addListener('sdcard:json', handleSdcardJson);

        return () => {
            controller.removeListener('sdcard:json', handleSdcardJson);
        };
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-4/5 portrait:w-4/5 overflow-hidden h-[90vh] portrait:h-4/5 flex flex-col">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full flex flex-col flex-1 gap-2 min-h-0 h-full"
                >
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                        <TabsTrigger value="config">ATCI Config</TabsTrigger>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="config"
                        className="flex-1 mt-4 min-h-0 h-0"
                    >
                        <ConfigTab uploading={uploading} uploadError={uploadError} />
                    </TabsContent>

                    <TabsContent
                        value="templates"
                        className="flex-1 mt-4 min-h-0 h-0 flex flex-col overflow-hidden"
                    >
                        <TemplatesTab />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
