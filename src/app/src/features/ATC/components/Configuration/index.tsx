import React, { useState } from 'react';
import Button from 'app/components/Button';
import { Settings } from 'lucide-react';
import { ConfigModal } from 'app/features/ATC/components/Configuration/components/ConfigModal.tsx';
import { ConfigProvider } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';
import controller from 'app/lib/controller.ts';

export function ATCIConfiguration() {
    const [modalOpen, setModalOpen] = useState(false);

    function onConfigOpen(isOpen) {
        if (isOpen) {
            controller.command('sdcard:read', 'ATCI.macro');
        }
        setModalOpen(isOpen);
    }

    return (
        <div className="max-w-4xl portrait:w-4/5 mx-auto space-y-8">
            <ConfigProvider>
                <div className="flex justify-center">
                    <Button
                        onClick={() => onConfigOpen(true)}
                        className="flex items-center gap-2 text-black text-4xl"
                        variant="ghost"
                        size="lg"
                    >
                        <Settings className="h-4 w-4 text-4xl" />
                    </Button>
                </div>

                <ConfigModal
                    open={modalOpen}
                    onOpenChange={(state) => onConfigOpen(state)}
                />
            </ConfigProvider>
        </div>
    );
}
