import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { RootState } from 'app/store/redux';
import { GRBL_ACTIVE_STATE_ALARM } from 'app/constants';
import pubsub from 'pubsub-js';

export const AccessibilityAnnouncer: React.FC = () => {
    const {
        statusAnnouncements,
        jobProgressAnnouncements,
        jobProgressIncrement,
        audioCues,
        reducedMotion,
        gcodeSummary,
    } = useTypedSelector((state: RootState) => state.preferences.accessibility);

    const activeState = useTypedSelector(
        (state: RootState) => state.controller.state?.status?.activeState,
    );
    const progress = useTypedSelector(
        (state: RootState) => state.controller.sender?.progress || 0,
    );
    const file = useTypedSelector((state: RootState) => state.file);

    const [statusMessage, setStatusMessage] = useState('');
    const [progressMessage, setProgressMessage] = useState('');
    const [summaryMessage, setSummaryMessage] = useState('');
    
    const lastAnnouncedProgress = useRef(0);
    const prevStatus = useRef(activeState);
    const audioContext = useRef<AudioContext | null>(null);

    // Audio Cue helper
    const playSound = (type: 'success' | 'alarm' | 'info') => {
        if (!audioCues.enabled) return;
        
        try {
            if (!audioContext.current) {
                audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            
            const ctx = audioContext.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            const now = ctx.currentTime;
            
            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'alarm') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(220, now + 0.1);
                osc.frequency.setValueAtTime(440, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.setValueAtTime(0.1, now + 0.3);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            } else {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(660, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {
            console.error('Failed to play audio cue', e);
        }
    };

    // Status Announcements & Audio Cues
    useEffect(() => {
        if (activeState && activeState !== prevStatus.current) {
            if (statusAnnouncements) {
                setStatusMessage(`Machine status changed to ${activeState}`);
            }

            // Audio Cues
            if (audioCues.enabled) {
                if (activeState === GRBL_ACTIVE_STATE_ALARM && audioCues.alarmTriggered) {
                    playSound('alarm');
                } else if (prevStatus.current === 'Run' && activeState === 'Idle' && audioCues.jobComplete) {
                    playSound('success');
                }
            }

            prevStatus.current = activeState;
            const timer = setTimeout(() => setStatusMessage(''), 1000);
            return () => clearTimeout(timer);
        }
    }, [activeState, statusAnnouncements, audioCues]);

    // Probe Success Audio Cue
    useEffect(() => {
        const token = pubsub.subscribe('probe:success', () => {
            if (audioCues.enabled && audioCues.probeSuccess) {
                playSound('success');
            }
        });
        return () => {
            pubsub.unsubscribe(token);
        };
    }, [audioCues]);

    // Tool Change Audio Cue
    useEffect(() => {
        const token = pubsub.subscribe('toolchange:start', () => {
            if (audioCues.enabled && audioCues.toolChange) {
                playSound('info');
            }
        });
        return () => {
            pubsub.unsubscribe(token);
        };
    }, [audioCues]);

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
            lastAnnouncedProgress.current = 0;
        }
    }, [progress, jobProgressAnnouncements, jobProgressIncrement]);

    // G-Code Summary
    const { units } = useTypedSelector((state: RootState) => state.controller.state?.status || { units: 'mm' });

    useEffect(() => {
        if (!gcodeSummary.enabled || !file.name) {
            setSummaryMessage('');
            return;
        }

        const {
            bbox,
            name,
            estimatedTime,
            toolSet,
            spindleSet,
            movementSet,
            invalidGcode,
            usedAxes,
        } = file;

        const formatTime = (seconds: number): string => {
            if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
            if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes and ${Math.ceil(seconds % 60)} seconds`;
            return `${Math.floor(seconds / 3600)} hours and ${Math.floor((seconds % 3600) / 60)} minutes`;
        };

        const summaryParts: string[] = [`File loaded: ${name}.`];

        if (bbox && bbox.min && bbox.max) {
            const dx = (bbox.max.x - bbox.min.x).toFixed(2);
            const dy = (bbox.max.y - bbox.min.y).toFixed(2);
            const dz = (bbox.max.z - bbox.min.z).toFixed(2);
            summaryParts.push(`Dimensions: ${dx} wide, ${dy} deep, and ${dz} high ${units}.`);
            summaryParts.push(`X ranges from ${bbox.min.x.toFixed(2)} to ${bbox.max.x.toFixed(2)}.`);
            summaryParts.push(`Y ranges from ${bbox.min.y.toFixed(2)} to ${bbox.max.y.toFixed(2)}.`);
            summaryParts.push(`Minimum Z height is ${bbox.min.z.toFixed(2)} ${units}.`);
        }

        if (estimatedTime > 0) {
            summaryParts.push(`Estimated completion time: ${formatTime(estimatedTime)}.`);
        }

        if (toolSet && toolSet.length > 0) {
            const tools = toolSet.map(t => t.replace('T', '')).join(', ');
            summaryParts.push(`Uses ${toolSet.length} tool${toolSet.length > 1 ? 's' : ''}: ${tools}.`);
        }

        // Additional parsing from content
        const content = file.content || '';
        
        // Parse CAM comments from first 100 lines
        const lines = content.split('\n').slice(0, 100);
        const camMetadata: string[] = [];
        lines.forEach(line => {
            if (line.includes('(') || line.includes(';')) {
                const comment = line.match(/\((.*)\)|;(.*)/);
                if (comment) {
                    const text = (comment[1] || comment[2] || '').trim();
                    if (text.toLowerCase().includes('tool') || text.toLowerCase().includes('stock')) {
                        camMetadata.push(text);
                    }
                }
            }
        });

        if (camMetadata.length > 0) {
            summaryParts.push(`Job metadata: ${camMetadata.join(', ')}.`);
        }

        const stopCount = (content.match(/^M0|^M1/gm) || []).length;
        if (stopCount > 0) {
            summaryParts.push(`Contains ${stopCount} program stop${stopCount > 1 ? 's' : ''} (M0/M1).`);
        }

        const hasCoolant = content.match(/M7|M8/i);
        if (hasCoolant) {
            summaryParts.push(`File requests coolant (M7/M8).`);
        }

        if (spindleSet && spindleSet.length > 0) {
            const speeds = spindleSet.map(s => Number(s.replace('S', ''))).sort((a, b) => a - b);
            if (speeds[0] === speeds[speeds.length - 1]) {
                summaryParts.push(`Spindle speed: ${speeds[0]} RPM.`);
            } else {
                summaryParts.push(`Spindle speed range: ${speeds[0]} to ${speeds[speeds.length - 1]} RPM.`);
            }
        }

        if (movementSet && movementSet.length > 0) {
            const feeds = movementSet.map(f => Number(f.replace('F', ''))).sort((a, b) => a - b);
            if (feeds[0] === feeds[feeds.length - 1]) {
                summaryParts.push(`Feedrate: ${feeds[0]} ${units}/min.`);
            } else {
                summaryParts.push(`Feedrate range: ${feeds[0]} to ${feeds[feeds.length - 1]} ${units}/min.`);
            }
        }

        if (usedAxes && usedAxes.length > 0) {
            summaryParts.push(`Active axes: ${usedAxes.join(', ').toUpperCase()}.`);
        }

        if (invalidGcode && invalidGcode.length > 0) {
            summaryParts.push(`WARNING: ${invalidGcode.length} invalid G-code lines detected.`);
        }

        setSummaryMessage(summaryParts.join(' '));
    }, [file, gcodeSummary.enabled, units]);

    // Reduced Motion effect
    useEffect(() => {
        if (reducedMotion) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
    }, [reducedMotion]);

    return (
        <>
            <div className="sr-only" aria-atomic="true">
                <div aria-live="assertive">{statusMessage}</div>
                <div aria-live="polite">{progressMessage}</div>
                <div aria-live="polite">{summaryMessage}</div>
            </div>
            {gcodeSummary.enabled && gcodeSummary.showVisually && summaryMessage && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-4 mx-4 rounded-r-md text-sm text-blue-700 dark:text-blue-200">
                    <p className="font-bold">Job Summary</p>
                    <p>{summaryMessage}</p>
                </div>
            )}
        </>
    );
};
