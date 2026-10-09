import { useEffect, useState } from 'react';

const formatTime = () =>
    new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

/** 24-hour HH:MM:SS, ticking once a second. */
export function useClock(): string {
    const [time, setTime] = useState(formatTime);
    useEffect(() => {
        const id = setInterval(() => setTime(formatTime()), 1000);
        return () => clearInterval(id);
    }, []);
    return time;
}
