import React, { useEffect, useState, useRef } from 'react';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { RootState } from 'app/store/redux';

export const AccessibilityAnnouncer: React.FC = () => {
    const {
        statusAnnouncements,
        jobProgressAnnouncements,
        jobProgressIncrement,
    } = useTypedSelector((state: RootState) => state.preferences.accessibility);

    const activeState = useTypedSelector(
        (state: RootState) => state.controller.state?.status?.activeState,
    );
    const progress = useTypedSelector(
        (state: RootState) => state.controller.sender?.progress || 0,
    );

    const [statusMessage, setStatusMessage] = useState('');
    const [progressMessage, setProgressMessage] = useState('');
    
    const lastAnnouncedProgress = useRef(0);
    const prevStatus = useRef(activeState);

    // Status Announcements
    useEffect(() => {
        if (!statusAnnouncements) return;

        if (activeState && activeState !== prevStatus.current) {
            setStatusMessage(`Machine status changed to ${activeState}`);
            prevStatus.current = activeState;
            
            // Clear message after announcement to allow re-announcing same state if needed later
            const timer = setTimeout(() => setStatusMessage(''), 1000);
            return () => clearTimeout(timer);
        }
    }, [activeState, statusAnnouncements]);

    // Progress Announcements
    useEffect(() => {
        if (!jobProgressAnnouncements) return;

        const currentProgress = Math.floor(progress);
        const nextThreshold = lastAnnouncedProgress.current + jobProgressIncrement;

        if (currentProgress >= nextThreshold && currentProgress < 100) {
            setProgressMessage(`Job progress: ${currentProgress}%`);
            lastAnnouncedProgress.current = Math.floor(currentProgress / jobProgressIncrement) * jobProgressIncrement;
        } else if (currentProgress === 100 && lastAnnouncedProgress.current !== 100) {
            setProgressMessage('Job complete: 100%');
            lastAnnouncedProgress.current = 100;
        } else if (currentProgress < lastAnnouncedProgress.current) {
            // Reset if a new job starts
            lastAnnouncedProgress.current = 0;
        }
    }, [progress, jobProgressAnnouncements, jobProgressIncrement]);

    return (
        <div className="sr-only" aria-atomic="true">
            <div aria-live="assertive">{statusMessage}</div>
            <div aria-live="polite">{progressMessage}</div>
        </div>
    );
};
