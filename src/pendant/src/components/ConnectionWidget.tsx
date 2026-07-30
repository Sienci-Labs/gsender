import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';
import pubsub from 'pubsub-js';
import {
    Plug,
    PlugZap,
    Loader2,
    AlertTriangle,
    Usb,
    Network,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';

import controller from '@gsender/controller-client/controller';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';

import store from 'app/store';
import { GRBL } from 'app/constants';
import { isIPv4 } from 'app/lib/utils';
import WidgetConfig from 'app/features/WidgetConfig/WidgetConfig';
import {
    ConnectionState,
    ConnectionType,
    type FirmwareFlavour,
} from 'app/features/Connection';
import { refreshPorts } from 'app/features/Connection/utils/connection';
import type { Port } from 'app/features/Connection/definitions';

/* Hold-to-disconnect timing. A press under TAP_MAX is a tap (toggles the
 * info card); a press held for DURATION disconnects. */
const DURATION = 900;
const TAP_MAX = 250;

/* Per-status colour treatment. The custom brand families (blue-700 #2c5d8b,
 * green-700 #047854, red-600 #c62222) render identically in light and dark,
 * so the tint/border/icon classes need no `dark:` variant. */
const STATUS_CLASSES: Record<
    ConnectionState,
    { tint: string; border: string; icon: string }
> = {
    [ConnectionState.DISCONNECTED]: {
        tint: 'bg-blue-700/15',
        border: 'border-blue-700',
        icon: 'text-blue-700',
    },
    [ConnectionState.CONNECTING]: {
        tint: 'bg-yellow-600/15',
        border: 'border-yellow-600',
        icon: 'text-yellow-600',
    },
    [ConnectionState.CONNECTED]: {
        tint: 'bg-green-700/15',
        border: 'border-green-700',
        icon: 'text-green-700',
    },
    [ConnectionState.ERROR]: {
        tint: 'bg-red-600/15',
        border: 'border-red-600',
        icon: 'text-red-600',
    },
};

const PILL_BASE =
    'conn-anim-pop-in flex items-center gap-2 w-48 h-11 pl-1.5 pr-3 rounded-md border';

function truncatePortName(port: string = ''): string {
    const portName = port.split('/').pop() ?? '';
    return portName.substring(Math.max(0, portName.length - 10));
}

interface PortRowData {
    key: string;
    kind: 'usb' | 'eth';
    label: string;
    meta: string;
    portValue: string;
    type: ConnectionType;
}

/* Anchored floating panel — shared by the port list and the info card. Opens
 * downward-left of the trigger (the widget sits at the left of the top bar).
 * Outside clicks close it via a transparent, non-dimming catch layer. */
function Dropdown({
    open,
    onClose,
    width = 'w-80',
    children,
}: {
    open: boolean;
    onClose: () => void;
    width?: string;
    children: React.ReactNode;
}) {
    if (!open) {
        return null;
    }
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                className={cn(
                    'conn-anim-dropdown-in absolute top-full left-0 mt-3 z-50 rounded-lg shadow-2xl overflow-hidden border',
                    'bg-white dark:bg-dark border-gray-300 dark:border-outline',
                    width,
                )}
            >
                {children}
            </div>
        </>
    );
}

function PortRow({
    row,
    index,
    muted,
    onSelect,
}: {
    row: PortRowData;
    index: number;
    muted?: boolean;
    onSelect: (row: PortRowData) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(row)}
            style={{ animationDelay: `${index * 50}ms` }}
            className="conn-anim-pop-in w-full flex items-center gap-3 px-3 py-3.5 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 outline-none"
        >
            <span
                className={cn(
                    'conn-anim-port-glow flex items-center justify-center w-12 h-12 rounded-full shrink-0 bg-gray-100 dark:bg-slate-800',
                    muted ? 'text-gray-500 dark:text-gray-400' : 'text-blue-700',
                )}
            >
                {row.kind === 'eth' ? (
                    <Network className="w-7 h-7" />
                ) : (
                    <Usb className="w-7 h-7" />
                )}
            </span>
            <span className="flex-1 text-left min-w-0">
                <span
                    className={cn(
                        'block text-sm font-semibold truncate',
                        muted
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-700 dark:text-gray-300',
                    )}
                >
                    {row.label}
                </span>
                <span className="block text-xs font-mono mt-0.5 text-gray-500 dark:text-gray-400">
                    {row.meta}
                </span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" />
        </button>
    );
}

function PortDropdown({
    open,
    onClose,
    recognized,
    unrecognized,
    onSelect,
}: {
    open: boolean;
    onClose: () => void;
    recognized: PortRowData[];
    unrecognized: PortRowData[];
    onSelect: (row: PortRowData) => void;
}) {
    const [showUnrecognized, setShowUnrecognized] = useState(false);

    useEffect(() => {
        if (!open) {
            setShowUnrecognized(false);
        }
    }, [open]);

    return (
        <Dropdown open={open} onClose={onClose} width="w-80">
            <div className="px-3 py-3">
                <p className="px-2 pb-1.5 text-xs font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Recognized
                </p>
                {recognized.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">
                        No devices found
                    </p>
                ) : (
                    <div className="space-y-1">
                        {recognized.map((row, i) => (
                            <PortRow
                                key={row.key}
                                row={row}
                                index={i}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                )}

                {unrecognized.length > 0 && (
                    <div className="mt-2">
                        <button
                            type="button"
                            onClick={() => setShowUnrecognized((v) => !v)}
                            className="w-full flex items-center justify-between px-2 py-2.5 text-xs font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400 outline-none"
                        >
                            Unrecognized Ports
                            <ChevronDown
                                className={cn(
                                    'w-4 h-4 transition-transform duration-300',
                                    showUnrecognized && 'rotate-180',
                                )}
                            />
                        </button>
                        {showUnrecognized && (
                            <div className="space-y-1">
                                {unrecognized.map((row, i) => (
                                    <PortRow
                                        key={row.key}
                                        row={row}
                                        index={i}
                                        muted
                                        onSelect={onSelect}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Dropdown>
    );
}

interface ConnectionConfigValues {
    baud: number;
    ip: string;
    ethernetPort: number;
}

function readConfigValues(): ConnectionConfigValues {
    const ipArr = store.get('widgets.connection.ip', []);
    return {
        baud: Number(store.get('widgets.connection.baudrate', 115200)),
        ip: Array.isArray(ipArr) ? ipArr.join('.') : String(ipArr ?? ''),
        ethernetPort: Number(store.get('widgets.connection.ethernetPort', 23)),
    };
}

export default function ConnectionWidget() {
    const connectionConfig = useMemo(() => new WidgetConfig('connection'), []);

    // Redux-backed data (populated by the pendant sagas' serialport:list bridge).
    const ports = useTypedSelector(
        (s: RootState) => s.connection.ports,
    ) as unknown as Port[];
    const unrecognizedPorts = useTypedSelector(
        (s: RootState) => s.connection.unrecognizedPorts,
    ) as unknown as Port[];
    const reportedFirmware = useTypedSelector(
        (s: RootState) => s.controller.type,
    ) as FirmwareFlavour;

    // Local 4-state machine (mirrors the desktop Connection widget).
    const [connectionState, setConnectionState] = useState(
        ConnectionState.DISCONNECTED,
    );
    const [, setConnectionType] = useState(ConnectionType.DISCONNECTED);
    const [firmware, setFirmware] = useState<FirmwareFlavour>(
        (store.get('widgets.connection.controller.type', 'Grbl') as FirmwareFlavour) ||
            'Grbl',
    );
    const [activePort, setActivePort] = useState('');
    const [cfg, setCfg] = useState<ConnectionConfigValues>(readConfigValues);

    // Floating-panel + hold state.
    const [sheetOpen, setSheetOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [holding, setHolding] = useState(false);

    const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef(0);
    const pressStartRef = useRef(0);

    // Refs mirroring latest values for use inside stable async callbacks.
    const activePortRef = useRef(activePort);
    const connectionStateRef = useRef(connectionState);
    useEffect(() => {
        activePortRef.current = activePort;
    }, [activePort]);
    useEffect(() => {
        connectionStateRef.current = connectionState;
    }, [connectionState]);

    const onControllerDisconnect = useCallback(() => {
        setConnectionState(ConnectionState.DISCONNECTED);
        setConnectionType(ConnectionType.DISCONNECTED);
        setActivePort('');
    }, []);

    const onDisconnectClick = useCallback(() => {
        setConnectionState(ConnectionState.DISCONNECTED);
        setConnectionType(ConnectionType.DISCONNECTED);
        setActivePort('');
        setInfoOpen(false);
        controller.closePort(activePortRef.current, (err: string) => {
            if (err) {
                console.error(err);
            }
            refreshPorts();
        });
    }, []);

    const handleConnect = useCallback(
        (portName: string, type: ConnectionType) => {
            if (!portName) {
                console.error('Connect called with empty port');
                return;
            }

            const network = type === ConnectionType.ETHERNET;
            const baud = Number(store.get('widgets.connection.baudrate'));
            const defaultFirmware = store.get('workspace.defaultFirmware', GRBL);
            const ethernetPort = store.get('widgets.connection.ethernetPort', 23);

            // Clear hold state so a stale red fill can't flash on (re)connect.
            setHolding(false);
            setProgress(0);

            setConnectionState(ConnectionState.CONNECTING);
            setConnectionType(type);
            setSheetOpen(false);
            setInfoOpen(false);

            // Safety net: network connects can hang silently — fall back to ERROR.
            if (connectTimeoutRef.current) {
                clearTimeout(connectTimeoutRef.current);
                connectTimeoutRef.current = null;
            }
            if (type === ConnectionType.ETHERNET) {
                connectTimeoutRef.current = setTimeout(() => {
                    connectTimeoutRef.current = null;
                    setConnectionState(ConnectionState.ERROR);
                }, 6000);
            }

            controller.openPort(
                portName,
                { baudrate: baud, network, defaultFirmware, ethernetPort },
                (err: string) => {
                    if (connectTimeoutRef.current) {
                        clearTimeout(connectTimeoutRef.current);
                        connectTimeoutRef.current = null;
                    }
                    if (err) {
                        setConnectionState(ConnectionState.ERROR);
                        return;
                    }
                    setConnectionState(ConnectionState.CONNECTED);
                    setActivePort(portName);
                },
            );

            connectionConfig.set('port', portName);
            connectionConfig.set('baudrate', baud);
        },
        [connectionConfig],
    );

    const attemptAutoConnect = useCallback(
        (force = false) => {
            const autoReconnect = connectionConfig.get('autoReconnect', false);
            const portVal = connectionConfig.get('port', null);

            if (
                connectionStateRef.current !== ConnectionState.DISCONNECTED ||
                (!autoReconnect && !force) ||
                !portVal
            ) {
                return;
            }

            handleConnect(
                portVal,
                isIPv4(portVal) ? ConnectionType.ETHERNET : ConnectionType.USB,
            );
        },
        [connectionConfig, handleConnect],
    );

    // Mount: wire the disconnect listener, seed firmware, list ports, autoconnect.
    useEffect(() => {
        const handleClose = () => onControllerDisconnect();
        controller.addListener('serialport:close', handleClose);

        refreshPorts();
        const autoConnectTimer = setTimeout(() => attemptAutoConnect(), 500);

        return () => {
            controller.removeListener('serialport:close', handleClose);
            clearTimeout(autoConnectTimer);
            if (connectTimeoutRef.current) {
                clearTimeout(connectTimeoutRef.current);
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [onControllerDisconnect, attemptAutoConnect]);

    // Respond to external reconnect requests.
    useEffect(() => {
        const token = pubsub.subscribe('reconnect', () => attemptAutoConnect(true));
        return () => {
            pubsub.unsubscribe(token);
        };
    }, [attemptAutoConnect]);

    // Keep the displayed firmware in sync with the controller's reported type.
    useEffect(() => {
        if (reportedFirmware) {
            setFirmware(reportedFirmware);
        }
    }, [reportedFirmware]);

    // Error auto-reverts to disconnected after 5s; the cleanup cancels the timer
    // whenever the status changes first, so a later transition isn't clobbered.
    useEffect(() => {
        if (connectionState !== ConnectionState.ERROR) {
            return;
        }
        const t = setTimeout(() => {
            setConnectionState(ConnectionState.DISCONNECTED);
            setConnectionType(ConnectionType.DISCONNECTED);
            setActivePort('');
        }, 5000);
        return () => clearTimeout(t);
    }, [connectionState]);

    // Hold-to-disconnect progress loop.
    const tick = useCallback(
        (ts: number) => {
            if (!startRef.current) {
                startRef.current = ts;
            }
            const pct = Math.min((ts - startRef.current) / DURATION, 1);
            setProgress(pct);
            if (pct >= 1) {
                startRef.current = 0;
                setHolding(false);
                setProgress(0);
                onDisconnectClick();
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        },
        [onDisconnectClick],
    );

    const startHold = () => {
        if (connectionStateRef.current !== ConnectionState.CONNECTED) {
            return;
        }
        pressStartRef.current = performance.now();
        startRef.current = 0;
        setHolding(true);
        rafRef.current = requestAnimationFrame(tick);
    };

    const endHold = () => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        startRef.current = 0;
        setHolding(false);
        setProgress(0);
        const pressed = pressStartRef.current;
        pressStartRef.current = 0;
        if (pressed > 0 && performance.now() - pressed < TAP_MAX) {
            setInfoOpen((v) => !v);
        }
    };

    const openSheet = () => {
        setCfg(readConfigValues());
        refreshPorts();
        setSheetOpen((o) => !o);
    };

    // Build the recognized / unrecognized row lists for the dropdown.
    const recognized: PortRowData[] = ports.map((p) => ({
        key: `usb-${p.port}`,
        kind: 'usb',
        label: truncatePortName(p.port),
        meta: `USB (${cfg.baud})`,
        portValue: p.port,
        type: ConnectionType.USB,
    }));
    if (cfg.ip) {
        recognized.push({
            key: `eth-${cfg.ip}`,
            kind: 'eth',
            label: cfg.ip,
            meta: `Ethernet (port ${cfg.ethernetPort})`,
            portValue: cfg.ip,
            type: ConnectionType.ETHERNET,
        });
    }
    const unrecognized: PortRowData[] = unrecognizedPorts.map((p) => ({
        key: `unrec-${p.port}`,
        kind: 'usb',
        label: truncatePortName(p.port),
        meta: `USB (${cfg.baud})`,
        portValue: p.port,
        type: ConnectionType.USB,
    }));

    const onSelectPort = (row: PortRowData) => {
        handleConnect(row.portValue, row.type);
    };

    const status = STATUS_CLASSES[connectionState];
    const displayPort = truncatePortName(activePort) || activePort;

    return (
        <div className="relative">
            <div className="relative z-50">
                {connectionState === ConnectionState.DISCONNECTED && (
                    <button
                        key="disconnected"
                        type="button"
                        onClick={openSheet}
                        className={cn(
                            PILL_BASE,
                            status.tint,
                            status.border,
                            'active:scale-95 transition-transform',
                        )}
                    >
                        <span className="flex items-center justify-center w-11 h-11 shrink-0">
                            <Plug className={cn('w-6 h-6', status.icon)} />
                        </span>
                        <span className="flex-1 min-w-0 text-left truncate font-semibold text-sm text-black dark:text-white">
                            Connect to CNC
                        </span>
                    </button>
                )}

                {connectionState === ConnectionState.CONNECTING && (
                    <div
                        key="connecting"
                        className={cn(
                            PILL_BASE,
                            status.tint,
                            status.border,
                            'conn-anim-shimmer',
                        )}
                    >
                        <span className="flex items-center justify-center w-11 h-11 shrink-0">
                            <Loader2
                                className={cn('w-6 h-6 animate-spin', status.icon)}
                            />
                        </span>
                        <span className="flex-1 min-w-0 text-left truncate font-semibold text-sm text-black dark:text-white">
                            Connecting…
                        </span>
                    </div>
                )}

                {connectionState === ConnectionState.ERROR && (
                    <button
                        key="error"
                        type="button"
                        onClick={openSheet}
                        className={cn(
                            PILL_BASE,
                            status.tint,
                            status.border,
                            'active:scale-95 transition-transform',
                        )}
                    >
                        <span className="flex items-center justify-center w-11 h-11 shrink-0">
                            <AlertTriangle className={cn('w-6 h-6', status.icon)} />
                        </span>
                        <span className="flex-1 min-w-0 text-left truncate font-semibold text-sm text-red-600">
                            Connection failed
                        </span>
                    </button>
                )}

                {connectionState === ConnectionState.CONNECTED && (
                    <button
                        key="connected"
                        type="button"
                        onPointerDown={startHold}
                        onPointerUp={endHold}
                        onPointerLeave={endHold}
                        className={cn(
                            PILL_BASE,
                            status.tint,
                            status.border,
                            'relative overflow-hidden touch-none select-none',
                        )}
                    >
                        {holding && (
                            <span
                                className="absolute inset-y-0 left-0 bg-red-600"
                                style={{ width: `${progress * 100}%` }}
                            />
                        )}
                        <span className="relative flex items-center justify-center w-11 h-11 shrink-0">
                            <PlugZap className={cn('w-6 h-6', status.icon)} />
                        </span>
                        <span className="relative flex-1 min-w-0 text-left leading-tight">
                            <span className="block text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
                                {firmware || 'Connected'}
                            </span>
                            <span className="block text-xs font-mono truncate text-gray-600 dark:text-gray-400">
                                {displayPort}
                            </span>
                        </span>
                    </button>
                )}
            </div>

            {/* Info card — opened by a quick tap while connected. */}
            <Dropdown
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
                width="w-64"
            >
                <div className="p-4 text-sm space-y-2">
                    <p className="font-mono text-gray-700 dark:text-gray-300">
                        Firmware: {firmware || '—'}
                    </p>
                    <p className="font-mono text-gray-700 dark:text-gray-300">
                        Port: {displayPort || '—'} · {cfg.baud}
                    </p>
                    <p className="text-xs pt-2 border-t border-gray-300 dark:border-outline text-gray-500 dark:text-gray-400">
                        Hold the button to disconnect.
                    </p>
                </div>
            </Dropdown>

            <PortDropdown
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                recognized={recognized}
                unrecognized={unrecognized}
                onSelect={onSelectPort}
            />
        </div>
    );
}
