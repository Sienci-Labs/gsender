import React, { useState } from 'react';
import { Dialog, DialogContent } from 'app/components/shadcn/Dialog.tsx';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from 'app/components/shadcn/Tabs';
import { ConfigTab } from './ConfigTab';
import { TemplatesTab } from './TemplatesTab';

interface ConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
    open,
    onOpenChange,
}) => {
    const [activeTab, setActiveTab] = useState('config');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-2/5 overflow-y-auto h-[85vh] flex flex-col">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full flex flex-col flex-1"
                >
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                        <TabsTrigger value="config">ATCI Config</TabsTrigger>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                    </TabsList>

                    <TabsContent value="config" className="flex-1 mt-4">
                        <ConfigTab />
                    </TabsContent>

                    <TabsContent value="templates" className="flex-1 mt-4">
                        <TemplatesTab />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
