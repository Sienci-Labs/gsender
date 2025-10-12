import {
    useState,
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
} from 'react';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import color from 'cli-color';
import { useDispatch } from 'react-redux';
import uuidv4 from 'uuid/v4';

import controller, {
    addControllerEvents,
    removeControllerEvents,
} from 'app/lib/controller';
import {
    TERMINAL_GREY,
    TERMINAL_RED,
    TERMINAL_ALARM_RED,
    WORKSPACE_MODE,
} from 'app/constants';
import { addToHistory } from 'app/store/redux/slices/console.slice';
import store from 'app/store';

import '@xterm/xterm/css/xterm.css';

// These will be loaded dynamically
let XtermTerminal: any;
let FitAddon: any;

type TerminalRef = {
    clear: () => void;
};

type Props = {
    isActive: boolean;
};

const Terminal = (
    { isActive }: Props,
    ref: React.ForwardedRef<TerminalRef>,
) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminalInstance = useRef<XtermTerminal | null>(null);
    const fitAddonInstance = useRef<FitAddon | null>(null);
    const [senderId] = useState(uuidv4());
    const dispatch = useDispatch();

    useImperativeHandle(ref, () => ({
        clear: () => {
            if (terminalInstance.current) {
                terminalInstance.current.clear();
            }
        },
    }));

    useEffect(() => {
        // Only load xterm in the browser
        if (typeof window === 'undefined') {
            return;
        }

        let mounted = true;
        let debouncedRefitTerminal: (() => void) | null = null;

        const initTerminal = async () => {
            // Dynamically import xterm modules (browser only)
            const XtermPkg = await import('@xterm/xterm');
            const FitAddonPkg = await import('@xterm/addon-fit');

            XtermTerminal = XtermPkg.Terminal;
            FitAddon = FitAddonPkg.FitAddon;

            if (!mounted) return;

            const newTerminal = new XtermTerminal({
                scrollback: 1000,
                scrollSensitivity: 0.5,
                smoothScrollDuration: 100,
                tabStopWidth: 4,
                fontFamily:
                    'Consolas, Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace, serif',
                fontSize: 14,
                cursorStyle: 'underline',
            });

            const newFitAddon = new FitAddon();
            newTerminal.loadAddon(newFitAddon);

            newTerminal.open(terminalRef.current);

            newFitAddon.fit();

            terminalInstance.current = newTerminal;
            fitAddonInstance.current = newFitAddon;

            addControllerEvents(controllerEvents);

            debouncedRefitTerminal = debounce(() => {
                if (fitAddonInstance.current) {
                    fitAddonInstance.current.fit();
                }
            }, 50);

            window.addEventListener('resize', debouncedRefitTerminal);
        };

        initTerminal();

        return () => {
            mounted = false;
            removeControllerEvents(controllerEvents);
            if (terminalInstance.current) {
                terminalInstance.current.dispose();
            }
            if (debouncedRefitTerminal) {
                window.removeEventListener('resize', debouncedRefitTerminal);
            }
        };
    }, []);

    useEffect(() => {
        if (isActive && fitAddonInstance.current) {
            fitAddonInstance.current.fit();
        }
    }, [isActive]);

    const writeToTerminal = (data: string, source?: string) => {
        if (!terminalInstance.current || !data) {
            return;
        }

        dispatch(addToHistory(data));

        if (data.includes('error:')) {
            terminalInstance.current?.writeln(color.xterm(TERMINAL_RED)(data));
            return;
        }

        if (data.includes('ALARM:')) {
            terminalInstance.current?.writeln(
                color.xterm(TERMINAL_ALARM_RED)(data),
            );
            return;
        }

        if (source) {
            terminalInstance.current?.writeln(
                color.blackBright(source) +
                    ' ' +
                    color.xterm(TERMINAL_GREY)(data),
            );
            return;
        }

        terminalInstance.current?.writeln(color.white(data));
    };

    const controllerEvents = {
        'serialport:open': ({
            port,
            baudrate,
        }: {
            port: string;
            baudrate: number;
        }) => {
            if (fitAddonInstance.current) {
                fitAddonInstance.current.fit();
            }

            terminalInstance.current?.writeln(
                color.white.bold(`gSender - [${controller.type}]`),
            );

            terminalInstance.current?.writeln(
                color.white(
                    `Connected to ${port} with a baud rate of ${baudrate}`,
                ),
            );
            const { DEFAULT, ROTARY } = WORKSPACE_MODE;

            if (controller.type === 'grblHAL') {
                const isRotaryMode =
                    store.get('workspace.mode', DEFAULT) === ROTARY;
                controller.command('updateRotaryMode', isRotaryMode);
            }
        },
        'serialport:close': () => {
            terminalInstance.current?.clear();
        },
        'serialport:write': (
            data: string,
            context: { source: string; __sender__: string },
        ) => {
            const { source, __sender__ } = context;

            if (__sender__ === senderId || !terminalInstance.current) {
                return;
            }

            data = String(data).trim();
            // Handle non-ascii characters more gracefully
            data = data.replace(/[^\x20-\x7E]/g, (m) => {
                return '\\x' + m.charCodeAt(0).toString(16);
            });

            if (source) {
                writeToTerminal(data, source);
            } else {
                writeToTerminal(data);
            }
        },
        'serialport:read': (data: string) => {
            if (!terminalInstance.current) {
                return;
            }

            const isAnErrorMessage = data.includes('error:');

            if (isAnErrorMessage) {
                const throttledWriteToTerminal = throttle(
                    writeToTerminal,
                    250,
                    { trailing: false },
                );
                throttledWriteToTerminal(data);
                return;
            }

            writeToTerminal(data);
        },
    };

    return (
        <div className="overflow-hidden bg-black pl-1 rounded">
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    );
};

export default forwardRef(Terminal);
