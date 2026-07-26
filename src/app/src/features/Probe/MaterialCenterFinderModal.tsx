import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import controller from 'app/lib/controller';
import './MaterialCenterFinderModal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRunGcode: (gcode: string) => void;
}

interface SettingInputProps {
    label: string;
    value: number;
    setter: (v: number) => void;
    unit: string;
    step?: string;
    refKey: string;
    disabled?: boolean;
    inputRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement | null }>;
}

export const estimateMacroDurationMs = (macroScript: string): number => {
    const lines = macroScript.split(/\r?\n/);
    let durationMs = 4000;

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
            return;
        }

        const dwellMatch = trimmed.match(/^G4\s+P([0-9.]+)/i);
        if (dwellMatch) {
            durationMs += Number(dwellMatch[1]) * 1000;
            return;
        }

        if (/^G(?:0|1|2|3|38(?:\.\d+)?)\b/i.test(trimmed)) {
            durationMs += 1800;
            return;
        }

        if (/^G10\b/i.test(trimmed)) {
            durationMs += 500;
        }
    });

    return durationMs;
};

const SettingInput = React.memo(
    ({
        label,
        value,
        setter,
        unit,
        step = '1',
        refKey,
        disabled,
        inputRefs,
    }: SettingInputProps) => (
        <div className="material-center-finder-input-field">
            <label className="material-center-finder-input-label">{label}</label>
            <div className="material-center-finder-input-wrapper">
                <input
                    ref={(el) => {
                        if (el) {
                            inputRefs.current[refKey] = el;
                        }
                    }}
                    type="number"
                    step={step}
                    value={value}
                    onChange={(e) => setter(Number(e.target.value))}
                    className="material-center-finder-input"
                    disabled={disabled}
                />
                <span className="material-center-finder-input-unit">{unit}</span>
            </div>
        </div>
    ),
);

const MaterialCenterFinderModal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onRunGcode,
}) => {
    const [sizeX, setSizeX] = useState<number>(100.0);
    const [sizeY, setSizeY] = useState<number>(50.0);
    const [fastFeed, setFastFeed] = useState<number>(150.0);
    const [slowFeed, setSlowFeed] = useState<number>(50.0);
    const [retractDist, setRetractDist] = useState<number>(2.0);
    const [safeZ, setSafeZ] = useState<number>(5.0);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [dialogState, setDialogState] = useState<'idle' | 'success' | 'failed'>('idle');

    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
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

            if (rawLine && rawLine.includes('MATERIAL_CENTER_DONE')) {
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

    // Polling interval to catch state when serial string / feeder event is missed
    useEffect(() => {
        if (!isRunning) {
            runStartTimeRef.current = 0;
            return;
        }

        if (!runStartTimeRef.current) {
            runStartTimeRef.current = Date.now();
        }

        let idleCounter = 0;

        const intervalId = setInterval(() => {
            if (Date.now() - runStartTimeRef.current < 1500) {
                return;
            }

            const feeder = (controller as any)?.feeder;
            const state = (controller as any)?.state || (controller as any)?.portStatus;

            const feederQueue = feeder?.queue ?? feeder?.pending ?? 0;
            const activeState = (
                state?.status?.activeState ||
                state?.state ||
                ''
            ).toLowerCase();

            if (feederQueue === 0 && activeState === 'idle') {
                idleCounter++;
                if (idleCounter >= 5) {
                    clearInterval(intervalId);
                    triggerSuccess();
                }
            } else {
                idleCounter = 0;
            }
        }, 300);

        return () => {
            clearInterval(intervalId);
        };
    }, [isRunning]);

    useEffect(() => {
        if (!isOpen) {
            cancelRequestedRef.current = false;
            isRunningRef.current = false;
            hasCompletedRef.current = false;
            runStartTimeRef.current = 0;
            setDialogState('idle');
            setIsRunning(false);
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleRun = () => {
        cancelRequestedRef.current = false;
        hasCompletedRef.current = false;
        isRunningRef.current = true;
        runStartTimeRef.current = Date.now();
        setIsRunning(true);
        setDialogState('idle');

        const macroScript = `
; =========================================
; MATERIAL CENTER FINDER MACRO
; =========================================
%wait

%STOCK_X = ${sizeX}
%STOCK_Y = ${sizeY}
%PROBE_FEED_FAST = ${fastFeed}
%PROBE_FEED_SLOW = ${slowFeed}
%PROBE_RETRACT = ${retractDist}
%Z_SAFE_LIFT = ${safeZ}
%Z_UNDER_SURFACE = -4
%EDGE_MARGIN_MAJOR = 10 
%EDGE_MARGIN = 5

%UNITS=modal.units
%DISTANCE=modal.distance

G91
G21

; --- PROBE Z ---
G38.2 Z-50 F[PROBE_FEED_FAST]
G0 Z[PROBE_RETRACT]
G38.2 Z-5 F[PROBE_FEED_SLOW]
G0 Z[PROBE_RETRACT]
G4 P1
G10 L20 P0 Z[PROBE_RETRACT]
%Z_LIFT_TOTAL = Z_SAFE_LIFT - Z_UNDER_SURFACE
G0 Z[Z_LIFT_TOTAL]

; --- PROBE X EDGES ---
G0 X[ STOCK_X/2 + EDGE_MARGIN_MAJOR ]
G0 Z-[Z_LIFT_TOTAL - Z_UNDER_SURFACE]
G38.2 X-[ STOCK_X + 2*EDGE_MARGIN ] F[PROBE_FEED_FAST]
G0 X[PROBE_RETRACT]
G38.2 X-5 F[PROBE_FEED_SLOW]
%X_RIGHT = posx
G0 X[PROBE_RETRACT]
G0 Z[Z_LIFT_TOTAL]

G0 X-[ STOCK_X + 2*EDGE_MARGIN ]
G0 Z-[Z_LIFT_TOTAL]
G38.2 X[ STOCK_X + 2*EDGE_MARGIN ] F[PROBE_FEED_FAST]
G0 X-[PROBE_RETRACT]
G38.2 X5 F[PROBE_FEED_SLOW]
%X_LEFT = posx
G0 X-[PROBE_RETRACT]
G0 Z[Z_LIFT_TOTAL]

; Calculate middle of X chord and return to center
%X_CHORD = X_RIGHT - X_LEFT
G10 L20 P0 X[X_LEFT]
G0 X[X_CHORD/2 + PROBE_RETRACT]
%X_CENTER = posx
G4 P1
G10 L20 P0 X0

; --- PROBE Y EDGES ---
G0 Y[ STOCK_Y/2 + EDGE_MARGIN_MAJOR ]
G0 Z-[Z_LIFT_TOTAL]
G38.2 Y-[ STOCK_Y + 2*EDGE_MARGIN ] F[PROBE_FEED_FAST]
G0 Y[PROBE_RETRACT]
G38.2 Y-5 F[PROBE_FEED_SLOW]
%Y_TOP = posy
G0 Y[PROBE_RETRACT]
G0 Z[Z_LIFT_TOTAL]

G0 Y-[ STOCK_Y + 2*EDGE_MARGIN ]
G0 Z-[Z_LIFT_TOTAL]
G38.2 Y[ STOCK_Y + 2*EDGE_MARGIN ] F[PROBE_FEED_FAST]
G0 Y-[PROBE_RETRACT]
G38.2 Y5 F[PROBE_FEED_SLOW]
%Y_BTM = posy
G0 Y-[PROBE_RETRACT]
G0 Z[Z_LIFT_TOTAL]

; Calculate middle of Y chord and return to center
%Y_CHORD = Y_TOP - Y_BTM
G10 L20 P0 Y[Y_BTM]
G0 Y[Y_CHORD/2 + PROBE_RETRACT]
%Y_CENTER = posy
G4 P1
G10 L20 P0 Y0

(MSG, MATERIAL_CENTER_DONE)

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
            <div className="material-center-finder-overlay">
                <div className="material-center-finder-modal">
                    <div className="material-center-finder-header">
                        <div className="material-center-finder-title">
                            <span className="material-center-finder-title-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="22" y1="12" x2="18" y2="12"></line>
                                    <line x1="6" y1="12" x2="2" y2="12"></line>
                                    <line x1="12" y1="6" x2="12" y2="2"></line>
                                    <line x1="12" y1="22" x2="12" y2="18"></line>
                                </svg>
                            </span>
                            Material Center Finder
                        </div>
                        <button
                            onClick={onClose}
                            className="material-center-finder-close-btn"
                            disabled={isRunning}
                            title={isRunning ? 'Cannot close while probing is running' : 'Close'}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="material-center-finder-subtitle">
                        Probe the edges of your material to find the exact center. Place the probe roughly in the center of the material before starting. The macro will probe Z first then the edges and calculate the center point.
                    </div>

                    <div className="material-center-finder-body">
                        <div className="material-center-finder-diagram">
                            <div className="material-center-finder-diagram-line-h" />
                            <div className="material-center-finder-diagram-line-v" />
                            <div className="material-center-finder-material-block" />
                            <div className="material-center-finder-target-ring" />
                            <div className="material-center-finder-target-dot" />

                            <div className="material-center-finder-arrow-label top">
                                <span className="material-center-finder-arrow-text">+Y</span>
                                <div className="material-center-finder-arrow-dot" />
                                <span className="material-center-finder-arrow-symbol">↑</span>
                            </div>

                            <div className="material-center-finder-arrow-label bottom">
                                <span className="material-center-finder-arrow-symbol">↓</span>
                                <div className="material-center-finder-arrow-dot" />
                                <span className="material-center-finder-arrow-text">-Y</span>
                            </div>

                            <div className="material-center-finder-arrow-label left">
                                <span className="material-center-finder-arrow-text">-X</span>
                                <div className="material-center-finder-arrow-dot" />
                                <span className="material-center-finder-arrow-symbol">←</span>
                            </div>

                            <div className="material-center-finder-arrow-label right">
                                <span className="material-center-finder-arrow-symbol">→</span>
                                <div className="material-center-finder-arrow-dot" />
                                <span className="material-center-finder-arrow-text">+X</span>
                            </div>
                        </div>

                        <div className="material-center-finder-form-panel">
                            <div className="material-center-finder-form-group">
                                <div className="material-center-finder-form-group-label">Material Size (User Input)</div>
                                <SettingInput label="Size in X (Width)" value={sizeX} setter={setSizeX} unit="mm" refKey="sizeX" disabled={isRunning} inputRefs={inputRefs} />
                                <SettingInput label="Size in Y (Length)" value={sizeY} setter={setSizeY} unit="mm" refKey="sizeY" disabled={isRunning} inputRefs={inputRefs} />
                            </div>

                            <div className="material-center-finder-form-group">
                                <div className="material-center-finder-form-group-label">Probe Feedrates</div>
                                <SettingInput label="Fast Feed" value={fastFeed} setter={setFastFeed} unit="mm/min" step="10" refKey="fastFeed" disabled={isRunning} inputRefs={inputRefs} />
                                <SettingInput label="Slow Feed" value={slowFeed} setter={setSlowFeed} unit="mm/min" step="1" refKey="slowFeed" disabled={isRunning} inputRefs={inputRefs} />
                            </div>

                            <div className="material-center-finder-form-group">
                                <div className="material-center-finder-form-group-label">Probe Behavior</div>
                                <SettingInput label="Retract Distance" value={retractDist} setter={setRetractDist} unit="mm" step="0.1" refKey="retractDist" disabled={isRunning} inputRefs={inputRefs} />
                                <SettingInput label="Safe Z" value={safeZ} setter={setSafeZ} unit="mm" step="0.5" refKey="safeZ" disabled={isRunning} inputRefs={inputRefs} />
                            </div>
                        </div>
                    </div>

                    <div className="material-center-finder-footer">
                        <div className="material-center-finder-footer-left">
                            {isRunning && (
                                <div className="material-center-finder-running-status">
                                    <div className="material-center-finder-running-dot" />
                                    Running...
                                </div>
                            )}
                        </div>

                        <div className="material-center-finder-footer-right">
                            {isRunning ? (
                                <button onClick={handleCancel} className="material-center-finder-btn material-center-finder-btn-stop">
                                    ⏹ Stop Macro
                                </button>
                            ) : (
                                <button onClick={handleRun} className="material-center-finder-btn material-center-finder-btn-run">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="22" y1="12" x2="18" y2="12"></line>
                                        <line x1="6" y1="12" x2="2" y2="12"></line>
                                        <line x1="12" y1="6" x2="12" y2="2"></line>
                                        <line x1="12" y1="22" x2="12" y2="18"></line>
                                    </svg>
                                    Find Material Center
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {dialogState !== 'idle' && ReactDOM.createPortal(
                <div className="material-center-finder-confirmation-overlay">
                    <div className="material-center-finder-confirmation-dialog">
                        <div className={`material-center-finder-confirmation-title ${dialogState === 'success' ? 'success' : 'failed'}`}>
                            {dialogState === 'success' ? '✓ Probing Complete' : '⚠ Probing Failed'}
                        </div>
                        <div className="material-center-finder-confirmation-message">
                            {dialogState === 'success'
                                ? 'Material center found and set as origin.'
                                : 'Probing stopped before finishing.'}
                        </div>
                        <button onClick={handleCompletionAcknowledge} className="material-center-finder-confirmation-button">
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

export default MaterialCenterFinderModal;