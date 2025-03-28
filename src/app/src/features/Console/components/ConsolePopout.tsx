import { FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'app/lib/toaster';
import isElectron from 'is-electron';

export function ConsolePopout({ id = 'console' }) {
    function openWindow() {
        const route = `/console`;
        if (isElectron()) {
            window.ipcRenderer.send('open-new-window', route);
        } else {
            toast.info('This functionality is not available on web view.');
        }
    }

    return (
        <button
            className="absolute top-3 right-3 text-white text-2xl"
            onClick={() => openWindow()}
        >
            <FaExternalLinkAlt />
        </button>
    );
}
