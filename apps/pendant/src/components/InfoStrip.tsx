import { useState, useEffect } from 'react';

function Clock() {
    const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    useEffect(() => {
        const id = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
        }, 1000);
        return () => clearInterval(id);
    }, []);
    return <span>{time}</span>;
}

export default function InfoStrip() {
    return (
        <div className="flex items-center gap-6 px-4 py-1.5 bg-dark border-b border-dark-lighter shrink-0 text-sm text-gray-400">
            <span>Feed <strong className="text-white font-mono">0</strong> mm/min</span>
            <span>Spindle <strong className="text-white font-mono">0</strong> RPM</span>
            <span>Units <strong className="text-white">mm</strong></span>
            <div className="flex-1" />
            <span className="font-mono text-gray-500">
                <Clock />
            </span>
        </div>
    );
}
