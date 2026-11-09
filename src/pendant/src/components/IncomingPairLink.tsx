import api from 'app/api';
import { parsePairPayload } from 'app/features/RemoteFileReceive/pairPayload';
import controller from 'app/lib/controller.ts';
import { toast } from 'app/lib/toaster';
import { useEffect } from 'react';

/**
 * Handles desktop pairing from any screen:
 *  - a gsender-pendant://pair link the system camera app handed to
 *    MainActivity, which forwards it as a `gsender:pair` window event, and
 *  - the server's confirmation once the desktop claims the pending pair.
 * The in-app scanner (Remote File Receive tool) shares the same server flow.
 */
export default function IncomingPairLink() {
    useEffect(() => {
        const onPairLink = async (event: Event) => {
            const url = (event as CustomEvent<{ url?: string }>).detail?.url;
            const request = url ? parsePairPayload(url) : null;
            if (!request) {
                toast.error("That link isn't a gSender pairing code");
                return;
            }
            try {
                await api.remoteFileReceive.setPendingPair(request);
                toast.info(`Pairing with ${request.desktopName}…`, {
                    position: 'bottom-right',
                });
            } catch {
                toast.error(
                    'Turn on Remote File Receive (Tools) before pairing with a desktop',
                );
            }
        };
        const onPaired = (payload: { desktopName: string }) => {
            toast.success(`Paired with ${payload.desktopName}`, {
                position: 'bottom-right',
            });
        };

        window.addEventListener('gsender:pair', onPairLink);
        controller.addListener('remote:pair-complete', onPaired);
        return () => {
            window.removeEventListener('gsender:pair', onPairLink);
            controller.removeListener('remote:pair-complete', onPaired);
        };
    }, []);

    return null;
}
