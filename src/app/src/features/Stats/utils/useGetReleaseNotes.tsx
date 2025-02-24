import { useEffect, useState } from 'react';

import api from 'app/api';

type ReleaseNote = {
    version: string;
    date: string;
    notes: string[];
};

const useGetReleaseNotes = () => {
    const [status, setStatus] = useState<
        'idle' | 'loading' | 'error' | 'success'
    >('idle');
    const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);

    const fetchReleaseNotes = () => {
        setStatus('loading');
        api.releaseNotes
            .fetch()
            .then((res) => {
                setReleaseNotes(res.data);
            })
            .catch(() => {
                setStatus('error');
            })
            .finally(() => {
                setStatus('success');
            });
    };

    useEffect(() => {
        fetchReleaseNotes();
    }, []);

    console.log(releaseNotes);

    return { releaseNotes, status, fetchReleaseNotes };
};

export default useGetReleaseNotes;
