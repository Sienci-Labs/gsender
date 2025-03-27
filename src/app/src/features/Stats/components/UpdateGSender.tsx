import ReactParse from 'html-react-parser';
import { useEffect, useState } from 'react';
import get from 'lodash/get';
import { DownloadGSender } from 'app/features/Stats/components/DownloadGSender.tsx';
import { FaExternalLinkAlt } from 'react-icons/fa';
import isElectron from 'is-electron';

export function UpdateGSender({
    notes = {
        version: '1.5.0-EDGE-6',
        releaseDate: '2025-03-11T14:28:46.936Z',
        releaseNotes: [],
    },
}) {
    const [version, setVersion] = useState<string>('');
    const [releaseNotes, setReleaseNotes] = useState('');
    const [releaseDate, setReleaseDate] = useState<string>('');
    const [downloadPercent, setDownloadPercent] = useState<number>(0);

    useEffect(() => {
        if (isElectron()) {
            window.ipcRenderer.on(
                'update_download_progress',
                (t, percentage) => {
                    setDownloadPercent(percentage);
                },
            );
        }
    }, []);

    useEffect(() => {
        setVersion(notes.version);
        setReleaseDate(notes.releaseDate);
        const currentVersionNotes = notes.releaseNotes.find(
            (n) => n.version === notes.version,
        );

        setReleaseNotes(get(currentVersionNotes, 'note', ''));
    }, [notes]);

    return (
        <div className="grid grid-cols-3 grid-rows-1 gap-4">
            <DownloadGSender
                version={version}
                downloadPercent={downloadPercent}
            />
            <div className="col-span-2 flex flex-col">
                <div className="flex gap-2 items-center justify-between">
                    <h2 className="text-2xl font-bold">
                        What's new in v{version}
                    </h2>
                    <a
                        className="text-sm text-blue-500 underline"
                        href="https://github.com/Sienci-Labs/gsender"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <div className="flex items-center gap-1">
                            <FaExternalLinkAlt />
                            See all recent releases
                        </div>
                    </a>
                </div>
                <div className="relative h-full">
                    <div className="absolute top-0 left-0 w-full h-full overflow-y-auto border border-gray-300 rounded-md p-4">
                        {ReactParse(releaseNotes)}
                    </div>
                </div>
            </div>
        </div>
    );
}
