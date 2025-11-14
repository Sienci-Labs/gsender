import { FaExternalLinkAlt } from 'react-icons/fa';
import isElectron from 'is-electron';

import Tooltip from 'app/components/Tooltip';
import { toast } from 'app/lib/toaster';

export function ConsolePopout() {
    function openWindow() {
        const route = `/console`;
        if (isElectron()) {
            window.ipcRenderer.send('open-new-window', route);
        } else {
            toast.info('This functionality is not available on web view.', {
                position: 'bottom-right',
            });
        }
    }

    return (
        <Tooltip content="Open console in new window">
            <button
                className="absolute top-3 right-3 text-white text-2xl"
                onClick={() => openWindow()}
            >
                <FaExternalLinkAlt />
            </button>
        </Tooltip>
    );
}
