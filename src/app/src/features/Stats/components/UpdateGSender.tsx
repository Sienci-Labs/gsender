import ReactParse from 'html-react-parser';
import { useEffect, useState } from 'react';
import get from 'lodash/get';
import { DownloadGSender } from 'app/features/Stats/components/DownloadGSender.tsx';

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

    useEffect(() => {
        console.log(notes);
        setVersion(notes.version);
        setReleaseDate(notes.releaseDate);
        const currentVersionNotes = notes.releaseNotes.find(
            (n) => n.version === notes.version,
        );

        console.log(currentVersionNotes);
        setReleaseNotes(get(currentVersionNotes, 'note', ''));
    }, [notes]);

    return (
        <div>
            <DownloadGSender version={version} />
            <span>{ReactParse(releaseNotes)}</span>
            <div className="flex gap-2 items-center justify-between">
                <h2 className="text-2xl font-bold">What's new in v{version}</h2>
            </div>
            <div className="relative h-full">
                <div className="absolute top-0 left-0 w-full h-full overflow-y-auto border border-gray-300 rounded-md p-4">
                    {ReactParse(releaseNotes)}
                </div>
            </div>
        </div>
    );
}
