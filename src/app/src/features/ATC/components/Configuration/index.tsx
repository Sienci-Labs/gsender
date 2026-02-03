import React, { useState } from 'react';
import Button from 'app/components/Button';
import { Settings } from 'lucide-react';
import { ConfigModal } from 'app/features/ATC/components/Configuration/components/ConfigModal.tsx';
import { ConfigProvider } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';
import controller from 'app/lib/controller.ts';
import { toast } from 'app/lib/toaster';

export function ATCIConfiguration({ compact = false }: { compact?: boolean }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    function onConfigOpen(isOpen) {
        if (isOpen) {
            controller.command('sdcard:read', 'ATCI.macro');
            controller.addListener('ymodem:error', () => {
                toast.error('Error uploaded new config');
                setUploading(false);
            });
            controller.addListener('ymodem:complete', () => {
                setUploading(false);
            });
            controller.addListener('ymodem:start', () => {
                setUploading(true);
            });
        } else {
            controller.removeListener('ymodem:error');
            controller.removeListener('ymodem:complete');
            controller.removeListener('ymodem:start');
        }
        setModalOpen(isOpen);
    }

    const wrapperClassName = compact
        ? 'flex'
        : 'max-w-4xl portrait:w-4/5 mx-auto space-y-8';
    const buttonWrapperClassName = compact ? '' : 'flex justify-center';
    const buttonClassName = compact
        ? 'flex h-9 w-9 items-center justify-center bg-white border border-gray-200 shadow-sm'
        : 'flex items-center gap-2 text-black text-4xl';
    const iconClassName = compact ? 'h-4 w-4' : 'h-4 w-4 text-4xl';
    const buttonSize = compact ? 'icon' : 'lg';

    return (
        <div className={wrapperClassName}>
            <ConfigProvider>
                <div className={buttonWrapperClassName}>
                    <Button
                        onClick={() => onConfigOpen(true)}
                        className={buttonClassName}
                        variant="ghost"
                        size={buttonSize}
                    >
                        <Settings className={iconClassName} />
                    </Button>
                </div>

                <ConfigModal
                    open={modalOpen}
                    onOpenChange={(state) => onConfigOpen(state)}
                    uploading={uploading}
                />
            </ConfigProvider>
        </div>
    );
}
