import controller from 'app/lib/controller.ts';
import { useEffect, useState } from 'react';

export type IncomingFileTransferState =
    | 'idle'
    | 'receiving'
    | 'complete'
    | 'error';

export interface IncomingFileTransfer {
    state: IncomingFileTransferState;
    name: string;
    percent: number;
    message: string;
}

const IDLE: IncomingFileTransfer = {
    state: 'idle',
    name: '',
    percent: 0,
    message: '',
};

const RESET_DELAY_MS = { complete: 2000, error: 4000 } as const;

/**
 * Tracks a Send to Pendant upload in progress on this device, via the
 * remote:file-incoming:* events emitted by remoteFileReceive/index.js.
 * Shared by the toast, the top-bar pill, and this panel's own inline bar so
 * the event wiring lives in exactly one place.
 */
export function useIncomingFileTransfer(): IncomingFileTransfer {
    const [transfer, setTransfer] = useState<IncomingFileTransfer>(IDLE);

    useEffect(() => {
        const onStart = ({ name }: { name: string; size: number }) => {
            setTransfer({ state: 'receiving', name, percent: 0, message: '' });
        };
        const onProgress = (percent: number) => {
            setTransfer((prev) =>
                prev.state === 'receiving' ? { ...prev, percent } : prev,
            );
        };
        const onComplete = () => {
            setTransfer((prev) => ({
                ...prev,
                state: 'complete',
                percent: 100,
            }));
        };
        const onError = (message: string) => {
            setTransfer((prev) => ({ ...prev, state: 'error', message }));
        };

        controller.addListener('remote:file-incoming:start', onStart);
        controller.addListener('remote:file-incoming:progress', onProgress);
        controller.addListener('remote:file-incoming:complete', onComplete);
        controller.addListener('remote:file-incoming:error', onError);

        return () => {
            controller.removeListener('remote:file-incoming:start', onStart);
            controller.removeListener(
                'remote:file-incoming:progress',
                onProgress,
            );
            controller.removeListener(
                'remote:file-incoming:complete',
                onComplete,
            );
            controller.removeListener('remote:file-incoming:error', onError);
        };
    }, []);

    useEffect(() => {
        if (transfer.state !== 'complete' && transfer.state !== 'error') {
            return;
        }
        const delay = RESET_DELAY_MS[transfer.state];
        const timer = setTimeout(() => setTransfer(IDLE), delay);
        return () => clearTimeout(timer);
    }, [transfer.state]);

    return transfer;
}
