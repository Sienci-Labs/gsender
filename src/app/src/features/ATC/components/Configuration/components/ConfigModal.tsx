import React, { useEffect, useState } from 'react';
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
import { toast } from 'app/lib/toaster';

interface ConfigModalProps {
    open: boolean;
    uploading: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
    open,
    onOpenChange,
    uploading,
}) => {
    const [activeTab, setActiveTab] = useState('config');
    const { updateConfig, setStatus } = useConfigContext();

    useEffect(() => {
        // Set all config values to default, and then repopulate again from SD card.
        controller.addListener('sdcard:json', (payload) => {
            const updatedConfig = repopulateFromSDCard(payload.code);

            updateConfig({
                variables: { ...updatedConfig.variables },
            });
        });

        controller.addListener('ymodem:complete', () => {
            setStatus({ type: 'idle', message: '' });
            setTimeout(() => {
                controller.command('gcode', ['G65 P100', 'G65 P200']);
            }, 1000);
        });

        return () => {
            controller.removeListener('sdcard:json');
            controller.removeListener('ymodem:error');
            controller.removeListener('ymodem:complete');
        };
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-3/5 overflow-y-auto h-[85vh] flex flex-col">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full flex flex-col flex-1 gap-2"
                >
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                        <TabsTrigger value="config">ATCI Config</TabsTrigger>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                    </TabsList>

                    <TabsContent value="config" className="flex-1 mt-4">
                        <ConfigTab uploading={uploading} />
                    </TabsContent>

                    <TabsContent value="templates" className="flex-1 mt-4">
                        <TemplatesTab />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
