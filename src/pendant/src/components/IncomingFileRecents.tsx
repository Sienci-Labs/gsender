import controller from 'app/lib/controller.ts';
import { useEffect } from 'react';
import { saveRecentFileEntry } from '../hooks/useFileActions';

/**
 * Records a remotely-received file in the pendant's own Recent Files list as
 * soon as it arrives - not only once the operator opens it from the Remote
 * File Receive panel - so it shows up from any screen. Only fires for
 * library-mode transfers (the only ones saved to the server's incoming/
 * directory, and so the only ones that can be reloaded later).
 */
export default function IncomingFileRecents() {
    useEffect(() => {
        const onReceived = (payload: {
            name: string;
            savedName: string;
            size: number;
        }) => {
            saveRecentFileEntry({
                fileName: payload.name,
                fileSize: payload.size,
                timeLoaded: Date.now(),
                source: 'remote',
                savedName: payload.savedName,
            });
        };
        controller.addListener('remote:file-received', onReceived);
        return () => {
            controller.removeListener('remote:file-received', onReceived);
        };
    }, []);

    return null;
}
