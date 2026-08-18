import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import controller from 'app/lib/controller';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { IMPERIAL_UNITS } from 'app/constants';
import { in2mm } from 'app/lib/units';
import './BoreCenterFinderModal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRunGcode: (gcode: string) => void;
}

interface SettingInputProps {
    label: string;
    value: number | '';
    setter: (v: number | '') => void;
    unit: string;
    step?: string;
    placeholder?: string;
    disabled?: boolean;
}

const SettingInput = React.memo(
    ({
        label,
        value,
        setter,
        unit,
        step = '1',
        placeholder = '—',
        disabled,
    }: SettingInputProps) => (
        <div className="bore-center-finder-input-field">
            <label className="bore-center-finder-input-label">{label}</label>
            <div className="bore-center-finder-input-wrapper">
                <input
                    type="number"
                    step={step}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value;
                        setter(val === '' ? '' : Number(val));
                    }}
                    className="bore-center-finder-input"
                    disabled={disabled}
                />
                <span className="bore-center-finder-input-unit">{unit}</span>
            </div>
        </div>
    ),
);

const BoreCenterFinderModal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onRunGcode,
}) => {
    const { units } = useWorkspaceState();
    const isImperial = units === IMPERIAL_UNITS;

    const lengthUnit = isImperial ? 'in' : 'mm';
    const feedUnit = isImperial ? 'in/min' : 'mm/min';

    const [boreDia, setBoreDia] = useState<number | ''>('');
    const [fastFeed, setFastFeed] = useState<number>(isImperial ? 6.0 : 150.0);
    const [slowFeed, setSlowFeed] = useState<number>(isImperial ? 2.0 : 50.0);
    const [retractDist, setRetractDist] = useState<number>(isImperial ? 0.08 : 2.0);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [dialogState, setDialogState] = useState<'idle' | 'success' | 'failed'>('idle');

    useEffect(() => {
        if (isImperial) {
            setFastFeed(6.0);
            setSlowFeed(2.0);
            setRetractDist(0.08);
        } else {
            setFastFeed(150.0);
            setSlowFeed(50.0);
            setRetractDist(2.0);
        }
    }, [isImperial]);

    const isRunningRef = useRef<boolean>(false);
    const cancelRequestedRef = useRef<boolean>(false);
    const hasCompletedRef = useRef<boolean>(false);
    const runStartTimeRef = useRef<number>(0);

    const triggerSuccess = () => {
        if (!isRunningRef.current || cancelRequestedRef.current || hasCompletedRef.current) {
            return;
        }
        hasCompletedRef.current = true;
        isRunningRef.current = false;
        setIsRunning(false);
        setDialogState('success');
    };

    // Serial & feeder event listener
    useEffect(() => {
        const handleSerialData = (data: any) => {
            let rawLine = '';
            if (typeof data === 'string') {
                rawLine = data;
            } else if (data && typeof data === 'object') {
                rawLine = data.line || data.data || JSON.stringify(data);
            }

            if (rawLine && rawLine.includes('BORE_CENTER_DONE')) {
                triggerSuccess();
            }
        };

        const handleFeederEmpty = () => {
            if (isRunningRef.current && !cancelRequestedRef.current && !hasCompletedRef.current) {
                setTimeout(() => {
                    if (isRunningRef.current && !cancelRequestedRef.current) {
                        triggerSuccess();
                    }
                }, 500);
            }
        };

        if (controller) {
            if (typeof controller.on === 'function') {
                controller.on('serialport:read', handleSerialData);
                controller.on('feeder:status', handleSerialData);
            }
            if (controller.feeder && typeof controller.feeder.on === 'function') {
                controller.feeder.on('empty', handleFeederEmpty);
            }
        }

        return () => {
            if (controller) {
                if (typeof controller.off === 'function') {
                    controller.off('serialport:read', handleSerialData);
                    controller.off('feeder:status', handleSerialData);
                }
                if (controller.feeder && typeof controller.feeder.off === 'function') {
                    controller.feeder.off('empty', handleFeederEmpty);
                }
            }
        };
    }, []);

    // Polling safety check
    useEffect(() => {
        if (!isRunning) {
            return;
        }

        const interval = setInterval(() => {
            if (
                isRunningRef.current &&
                !cancelRequestedRef.current &&
                !hasCompletedRef.current &&
                runStartTimeRef.current > 0
            ) {
                const elapsed = Date.now() - runStartTimeRef.current;
                if (elapsed > 4000) {
                    try {
                        const status = controller?.state?.status?.activeState;
                        const isIdle = status === 'Idle' || status === 'idle';
                        if (isIdle) {
                            triggerSuccess();
                        }
                    } catch (e) {
                        // ignore state reading error
                    }
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning]);

    // Reset internal state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            cancelRequestedRef.current = false;
            hasCompletedRef.current = false;
            runStartTimeRef.current = 0;
            setDialogState('idle');
            setIsRunning(false);
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const isFormValid =
        typeof boreDia === 'number' &&
        !isNaN(boreDia) &&
        boreDia > 0;

    const handleRun = () => {
        if (!isFormValid) {
            return;
        }

        cancelRequestedRef.current = false;
        hasCompletedRef.current = false;
        isRunningRef.current = true;
        runStartTimeRef.current = Date.now();
        setIsRunning(true);
        setDialogState('idle');

        const effectiveBoreDia = isImperial ? in2mm(Number(boreDia)) : Number(boreDia);
        const effectiveFastFeed = isImperial ? in2mm(Number(fastFeed)) : Number(fastFeed);
        const effectiveSlowFeed = isImperial ? in2mm(Number(slowFeed)) : Number(slowFeed);
        const effectiveRetract = isImperial ? in2mm(Number(retractDist)) : Number(retractDist);

        const isLargeBore = effectiveBoreDia >= 50.0;
        const traverseCmd = isLargeBore ? 'G0' : 'G1 F800';

        const macroScript = `
; =========================================
; BORE / HOLE CENTER FINDER MACRO
; =========================================
%wait

%BORE_DIA = ${Number(effectiveBoreDia.toFixed(3))}
%PROBE_FEED_FAST = ${Number(effectiveFastFeed.toFixed(1))}
%PROBE_FEED_SLOW = ${Number(effectiveSlowFeed.toFixed(1))}
%PROBE_RETRACT = ${Number(effectiveRetract.toFixed(3))}
%MARGIN = 5

%UNITS=modal.units
%DISTANCE=modal.distance

G91
G21

; --- RECORD START POINT (EYEBALLED CENTER) ---
%X_START = posx
%Y_START = posy

; --- 1. PROBE +X INSIDE WALL ---
G38.2 X[ BORE_DIA/2 + MARGIN ] F[PROBE_FEED_FAST]
G0 X-[PROBE_RETRACT]
G38.2 X5 F[PROBE_FEED_SLOW]
%X_RIGHT = posx
G0 X-[PROBE_RETRACT]

; Return back to X start position
${traverseCmd} X-[ posx - X_START ]

; --- 2. PROBE -X INSIDE WALL ---
G38.2 X-[ BORE_DIA/2 + MARGIN ] F[PROBE_FEED_FAST]
G0 X[PROBE_RETRACT]
G38.2 X-5 F[PROBE_FEED_SLOW]
%X_LEFT = posx
G0 X[PROBE_RETRACT]

; --- 3. MOVE TO TRUE X CENTER & ZERO X ---
%X_TRUE_CENTER = (X_RIGHT + X_LEFT)/2
${traverseCmd} X[ X_TRUE_CENTER - posx ]
G4 P0.5
G10 L20 P0 X0

; Update Y start at true X center
%Y_START = posy

; --- 4. PROBE +Y INSIDE WALL ---
G38.2 Y[ BORE_DIA/2 + MARGIN ] F[PROBE_FEED_FAST]
G0 Y-[PROBE_RETRACT]
G38.2 Y5 F[PROBE_FEED_SLOW]
%Y_TOP = posy
G0 Y-[PROBE_RETRACT]

; Return back to Y start position
${traverseCmd} Y-[ posy - Y_START ]

; --- 5. PROBE -Y INSIDE WALL ---
G38.2 Y-[ BORE_DIA/2 + MARGIN ] F[PROBE_FEED_FAST]
G0 Y[PROBE_RETRACT]
G38.2 Y-5 F[PROBE_FEED_SLOW]
%Y_BTM = posy
G0 Y[PROBE_RETRACT]

; --- 6. MOVE TO TRUE Y CENTER & ZERO Y ---
%Y_TRUE_CENTER = (Y_TOP + Y_BTM)/2
${traverseCmd} Y[ Y_TRUE_CENTER - posy ]
G4 P0.5
G10 L20 P0 Y0

(MSG, BORE_CENTER_DONE)

[UNITS] [DISTANCE]
`;

        onRunGcode(macroScript);
    };

    const handleCancel = () => {
        cancelRequestedRef.current = true;
        isRunningRef.current = false;
        setIsRunning(false);

        if (controller && typeof controller.command === 'function') {
            controller.command('reset');
        }
        setDialogState('failed');
    };

    const handleCompletionAcknowledge = () => {
        setDialogState('idle');
        onClose();
    };

    return ReactDOM.createPortal(
        <>
            <div className="bore-center-finder-overlay">
                <div className="bore-center-finder-modal">
                    <div className="bore-center-finder-header">
                        <div className="bore-center-finder-title">
                            <span className="bore-center-finder-title-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="9"></circle>
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <line x1="12" y1="1" x2="12" y2="5"></line>
                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                    <line x1="1" y1="12" x2="5" y2="12"></line>
                                    <line x1="19" y1="12" x2="23" y2="12"></line>
                                </svg>
                            </span>
                            <span>Bore / Hole Center Finder</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="bore-center-finder-close-btn"
                            disabled={isRunning}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="bore-center-finder-subtitle">
                        Manually position probe tip roughly in the center of the bore at probing depth before running.
                    </div>

                    <div className="bore-center-finder-body">
                        <div className="bore-center-finder-diagram">
                            <div className="bore-center-finder-diagram-line-h" />
                            <div className="bore-center-finder-diagram-line-v" />

                            <div className="bore-center-finder-bore-outer" />
                            <div className="bore-center-finder-target-ring" />
                            <div className="bore-center-finder-target-center" />

                            <div className="bore-center-finder-arrow-label top">
                                <span className="bore-center-finder-arrow-symbol">↑</span>
                                <div className="bore-center-finder-arrow-dot" />
                                <span className="bore-center-finder-arrow-text">+Y Wall</span>
                            </div>

                            <div className="bore-center-finder-arrow-label bottom">
                                <span className="bore-center-finder-arrow-text">-Y Wall</span>
                                <div className="bore-center-finder-arrow-dot" />
                                <span className="bore-center-finder-arrow-symbol">↓</span>
                            </div>

                            <div className="bore-center-finder-arrow-label left">
                                <span className="bore-center-finder-arrow-symbol">←</span>
                                <div className="bore-center-finder-arrow-dot" />
                                <span className="bore-center-finder-arrow-text">-X Wall</span>
                            </div>

                            <div className="bore-center-finder-arrow-label right">
                                <span className="bore-center-finder-arrow-text">+X Wall</span>
                                <div className="bore-center-finder-arrow-dot" />
                                <span className="bore-center-finder-arrow-symbol">→</span>
                            </div>
                        </div>

                        <div className="bore-center-finder-form-panel">
                            <div className="bore-center-finder-form-group">
                                <div className="bore-center-finder-form-group-label">Bore Dimensions</div>
                                <SettingInput
                                    label="Estimated Bore Diameter"
                                    value={boreDia}
                                    setter={setBoreDia}
                                    unit={lengthUnit}
                                    step={isImperial ? "0.05" : "1"}
                                    disabled={isRunning}
                                />
                            </div>

                            <div className="bore-center-finder-form-group">
                                <div className="bore-center-finder-form-group-label">Probe Feedrates</div>
                                <SettingInput
                                    label="Fast Feed"
                                    value={fastFeed}
                                    setter={setFastFeed}
                                    unit={feedUnit}
                                    step={isImperial ? "0.5" : "10"}
                                    disabled={isRunning}
                                />
                                <SettingInput
                                    label="Slow Feed"
                                    value={slowFeed}
                                    setter={setSlowFeed}
                                    unit={feedUnit}
                                    step={isImperial ? "0.1" : "1"}
                                    disabled={isRunning}
                                />
                            </div>

                            <div className="bore-center-finder-form-group">
                                <div className="bore-center-finder-form-group-label">Probe Behavior</div>
                                <SettingInput
                                    label="Retract Distance"
                                    value={retractDist}
                                    setter={setRetractDist}
                                    unit={lengthUnit}
                                    step={isImperial ? "0.01" : "0.1"}
                                    disabled={isRunning}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bore-center-finder-footer">
                        <div className="bore-center-finder-footer-left">
                            {isRunning && (
                                <div className="bore-center-finder-running-status">
                                    <div className="bore-center-finder-running-dot" />
                                    Probing Bore...
                                </div>
                            )}
                        </div>

                        <div className="bore-center-finder-footer-right">
                            {isRunning ? (
                                <button onClick={handleCancel} className="bore-center-finder-btn bore-center-finder-btn-stop">
                                    ⏹ Stop Macro
                                </button>
                            ) : (
                                <button
                                    onClick={handleRun}
                                    disabled={!isFormValid || isRunning}
                                    className="bore-center-finder-btn bore-center-finder-btn-run"
                                    title={!isFormValid ? 'Please enter estimated bore diameter' : 'Find Bore Center'}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="9"></circle>
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <line x1="12" y1="1" x2="12" y2="5"></line>
                                        <line x1="12" y1="19" x2="12" y2="23"></line>
                                        <line x1="1" y1="12" x2="5" y2="12"></line>
                                        <line x1="19" y1="12" x2="23" y2="12"></line>
                                    </svg>
                                    Find Bore Center
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {dialogState !== 'idle' && ReactDOM.createPortal(
                <div className="bore-center-finder-confirmation-overlay">
                    <div className="bore-center-finder-confirmation-dialog">
                        <div className={`bore-center-finder-confirmation-title ${dialogState === 'success' ? 'success' : 'failed'}`}>
                            {dialogState === 'success' ? '✓ Probing Complete' : '⚠ Probing Failed'}
                        </div>
                        <div className="bore-center-finder-confirmation-message">
                            {dialogState === 'success'
                                ? 'Bore center found and set as X0 Y0 on active workspace.'
                                : 'Probing stopped before finishing.'}
                        </div>
                        <button
                            onClick={handleCompletionAcknowledge}
                            className="bore-center-finder-confirmation-button"
                        >
                            OK
                        </button>
                    </div>
                </div>,
                document.body,
            )}
        </>,
        document.body,
    );
};

export default BoreCenterFinderModal;
