import { useIncomingFileTransfer } from 'app/features/RemoteFileReceive/useIncomingFileTransfer';
import { toast } from 'app/lib/toaster';
import { useEffect, useRef } from 'react';

const TOAST_ID = 'incoming-file-transfer';
// Every toast call is also logged to the notification history - bucket
// progress updates instead of re-announcing on every single percent tick.
const PERCENT_BUCKET = 10;

/**
 * Drives a single toast through an incoming Send to Pendant transfer's
 * lifecycle, so the operator gets a notification from anywhere in the app -
 * not just while the Remote File Receive panel happens to be open.
 */
export default function IncomingFileToast() {
    const { state, name, percent, message } = useIncomingFileTransfer();
    const lastShownBucket = useRef(-1);

    useEffect(() => {
        if (state === 'receiving') {
            const bucket = Math.floor(percent / PERCENT_BUCKET);
            if (bucket === lastShownBucket.current) return;
            lastShownBucket.current = bucket;
            toast.loading(`Receiving ${name}… ${percent}%`, {
                id: TOAST_ID,
                duration: Infinity,
            });
        } else if (state === 'complete') {
            lastShownBucket.current = -1;
            toast.success(`Received ${name}`, {
                id: TOAST_ID,
                position: 'bottom-right',
            });
        } else if (state === 'error') {
            lastShownBucket.current = -1;
            toast.error(message || 'Failed to receive the file', {
                id: TOAST_ID,
                position: 'bottom-right',
            });
        }
    }, [state, name, percent, message]);

    return null;
}
