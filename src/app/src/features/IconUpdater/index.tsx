import gSenderIcon from 'app/workspace/TopBar/assets/icon-round.png';
import { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import cn from 'classnames';
import reduxStore from 'app/store/redux';
import isElectron from 'is-electron';
import { updateReleaseNotes } from 'app/store/redux/slices/gSenderInfo.slice.ts';
import { Link } from 'react-router';
import { toast } from 'app/lib/toaster';

export function UpdateBadge({ hidden }) {
    return (
        <Link
            className={cn(
                { hidden: !hidden },
                'absolute bottom-0 bg-green-500 left-4 rounded-full w-8 h-8 text-lg flex items-center justify-center animate-bounce border-red-500',
            )}
            to={`/stats/about`}
        >
            <span className="text-white">
                <FaDownload />
            </span>
        </Link>
    );
}

export function IconUpdater() {
    const [releaseNotes, setReleaseNotes] = useState({});
    const [showUpdater, setShowUpdater] = useState(false);

    useEffect(() => {
        if (isElectron()) {
            window.ipcRenderer.on('update_available', (token, info) => {
                reduxStore.dispatch(updateReleaseNotes(info));
                setReleaseNotes(info);
                setShowUpdater(true);
            });
            window.ipcRenderer.on('maximize-window', () => {
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 500)
            });
            window.ipcRenderer.invoke('get-startup-warnings').then(({ remoteModeFailed }) => {
                if (remoteModeFailed) {
                    toast.warning(
                        'Remote mode was automatically disabled due to an invalid configuration. Please update your Remote Mode settings.',
                        { position: 'bottom-right', duration: 10000 },
                    );
                }
            });
        }
    }, []);

    return (
        <div className="w-[40px] h-[40px] max-sm:hidden relative z-[10000]">
            <img alt="gSender Logo" src={gSenderIcon} />
            <UpdateBadge hidden={showUpdater} />
        </div>
    );
}
