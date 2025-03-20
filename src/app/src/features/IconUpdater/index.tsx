import gSenderIcon from 'app/workspace/TopBar/assets/icon-round.png';
import { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import cn from 'classnames';

export function UpdateBadge({ hidden }) {
    return (
        <div
            className={cn(
                { hidden: !hidden },
                'absolute bottom-0 bg-green-500 left-4 rounded-full w-8 h-8 text-lg flex items-center justify-center animate-bounce border-red-500',
            )}
        >
            <span className="text-white">
                <FaDownload />
            </span>
        </div>
    );
}

export function IconUpdater() {
    const [releaseNotes, setReleaseNotes] = useState({});
    const [showUpdater, setShowUpdater] = useState(false);

    return (
        <div className="w-[40px] h-[40px] max-sm:hidden relative">
            <img alt="gSender Logo" src={gSenderIcon} />
            <UpdateBadge hidden={showUpdater} />
        </div>
    );
}
