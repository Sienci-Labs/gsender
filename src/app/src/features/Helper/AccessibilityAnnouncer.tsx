import { useAppTranslation } from 'app/i18n';
import { GRBL_ACTIVE_STATE_ALARM } from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import pubsub from 'pubsub-js';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

export const AccessibilityAnnouncer: React.FC = () => {
    const { t } = useAppTranslation();
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
                audioContext.current = new (
                    window.AudioContext || (window as any).webkitAudioContext
                )();
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
                setStatusMessage(
                    t('helper:announcer.statusChanged', { state: activeState }),
                );
            }

            // Audio Cues
            if (audioCues.enabled) {
                if (
                    activeState === GRBL_ACTIVE_STATE_ALARM &&
                    audioCues.alarmTriggered
                ) {
                    playSound('alarm');
                } else if (
                    prevStatus.current === 'Run' &&
                    activeState === 'Idle' &&
                    audioCues.jobComplete
                ) {
                    playSound('success');
                }
            }

            prevStatus.current = activeState;
            const timer = setTimeout(() => setStatusMessage(''), 1000);
            return () => clearTimeout(timer);
        }
    }, [activeState, statusAnnouncements, audioCues, t]);

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
        const nextThreshold =
            lastAnnouncedProgress.current + jobProgressIncrement;

        if (currentProgress >= nextThreshold && currentProgress < 100) {
            setProgressMessage(
                t('helper:announcer.progress', { percent: currentProgress }),
            );
            lastAnnouncedProgress.current =
                Math.floor(currentProgress / jobProgressIncrement) *
                jobProgressIncrement;
        } else if (
            currentProgress === 100 &&
            lastAnnouncedProgress.current !== 100
        ) {
            setProgressMessage(t('helper:announcer.complete'));
            lastAnnouncedProgress.current = 100;
        } else if (currentProgress < lastAnnouncedProgress.current) {
            lastAnnouncedProgress.current = 0;
        }
    }, [progress, jobProgressAnnouncements, jobProgressIncrement, t]);

    // G-Code Summary
    const { units } = useTypedSelector(
        (state: RootState) => state.controller.state?.status || { units: 'mm' },
    );

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
            if (seconds < 60) {
                return t('helper:announcer.time.seconds', {
                    count: Math.ceil(seconds),
                });
            }
            if (seconds < 3600) {
                return t('helper:announcer.time.and', {
                    first: t('helper:announcer.time.minutes', {
                        count: Math.floor(seconds / 60),
                    }),
                    second: t('helper:announcer.time.seconds', {
                        count: Math.ceil(seconds % 60),
                    }),
                });
            }
            return t('helper:announcer.time.and', {
                first: t('helper:announcer.time.hours', {
                    count: Math.floor(seconds / 3600),
                }),
                second: t('helper:announcer.time.minutes', {
                    count: Math.floor((seconds % 3600) / 60),
                }),
            });
        };

        const summaryParts: string[] = [
            t('helper:announcer.summary.fileLoaded', { name }),
        ];

        if (bbox && bbox.min && bbox.max) {
            const dx = (bbox.max.x - bbox.min.x).toFixed(2);
            const dy = (bbox.max.y - bbox.min.y).toFixed(2);
            const dz = (bbox.max.z - bbox.min.z).toFixed(2);
            summaryParts.push(
                t('helper:announcer.summary.dimensions', {
                    x: dx,
                    y: dy,
                    z: dz,
                    units,
                }),
            );
            summaryParts.push(
                t('helper:announcer.summary.xRange', {
                    min: bbox.min.x.toFixed(2),
                    max: bbox.max.x.toFixed(2),
                }),
            );
            summaryParts.push(
                t('helper:announcer.summary.yRange', {
                    min: bbox.min.y.toFixed(2),
                    max: bbox.max.y.toFixed(2),
                }),
            );
            summaryParts.push(
                t('helper:announcer.summary.minZ', {
                    z: bbox.min.z.toFixed(2),
                    units,
                }),
            );
        }

        if (estimatedTime > 0) {
            summaryParts.push(
                t('helper:announcer.summary.estimatedTime', {
                    time: formatTime(estimatedTime),
                }),
            );
        }

        if (toolSet && toolSet.length > 0) {
            const tools = toolSet
                .map((tool) => tool.replace('T', ''))
                .join(', ');
            summaryParts.push(
                t('helper:announcer.summary.tools', {
                    count: toolSet.length,
                    tools,
                }),
            );
        }

        // Additional parsing from content
        const content = file.content || '';

        // Parse CAM comments from first 100 lines
        const lines = content.split('\n').slice(0, 100);
        const camMetadata: string[] = [];
        lines.forEach((line) => {
            if (line.includes('(') || line.includes(';')) {
                const comment = line.match(/\((.*)\)|;(.*)/);
                if (comment) {
                    const text = (comment[1] || comment[2] || '').trim();
                    if (
                        text.toLowerCase().includes('tool') ||
                        text.toLowerCase().includes('stock')
                    ) {
                        camMetadata.push(text);
                    }
                }
            }
        });

        if (camMetadata.length > 0) {
            summaryParts.push(
                t('helper:announcer.summary.metadata', {
                    metadata: camMetadata.join(', '),
                }),
            );
        }

        const stopCount = (content.match(/^M0|^M1/gm) || []).length;
        if (stopCount > 0) {
            summaryParts.push(
                t('helper:announcer.summary.programStops', {
                    count: stopCount,
                }),
            );
        }

        const hasCoolant = content.match(/M7|M8/i);
        if (hasCoolant) {
            summaryParts.push(t('helper:announcer.summary.coolant'));
        }

        if (spindleSet && spindleSet.length > 0) {
            const speeds = spindleSet
                .map((s) => Number(s.replace('S', '')))
                .sort((a, b) => a - b);
            if (speeds[0] === speeds[speeds.length - 1]) {
                summaryParts.push(
                    t('helper:announcer.summary.spindleSpeed', {
                        speed: speeds[0],
                    }),
                );
            } else {
                summaryParts.push(
                    t('helper:announcer.summary.spindleSpeedRange', {
                        min: speeds[0],
                        max: speeds[speeds.length - 1],
                    }),
                );
            }
        }

        if (movementSet && movementSet.length > 0) {
            const feeds = movementSet
                .map((f) => Number(f.replace('F', '')))
                .sort((a, b) => a - b);
            if (feeds[0] === feeds[feeds.length - 1]) {
                summaryParts.push(
                    t('helper:announcer.summary.feedrate', {
                        feed: feeds[0],
                        units,
                    }),
                );
            } else {
                summaryParts.push(
                    t('helper:announcer.summary.feedrateRange', {
                        min: feeds[0],
                        max: feeds[feeds.length - 1],
                        units,
                    }),
                );
            }
        }

        if (usedAxes && usedAxes.length > 0) {
            summaryParts.push(
                t('helper:announcer.summary.axes', {
                    axes: usedAxes.join(', ').toUpperCase(),
                }),
            );
        }

        if (invalidGcode && invalidGcode.length > 0) {
            summaryParts.push(
                t('helper:announcer.summary.invalidGcode', {
                    count: invalidGcode.length,
                }),
            );
        }

        setSummaryMessage(summaryParts.join(' '));
    }, [file, gcodeSummary.enabled, units, t]);

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
            {gcodeSummary.enabled &&
                gcodeSummary.showVisually &&
                summaryMessage && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-4 mx-4 rounded-r-md text-sm text-blue-700 dark:text-blue-200">
                        <p className="font-bold">
                            {t('helper:announcer.summaryTitle')}
                        </p>
                        <p>{summaryMessage}</p>
                    </div>
                )}
        </>
    );
};
