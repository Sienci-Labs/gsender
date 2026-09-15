import { WORKSPACE_MODE, WRITE_SOURCE_SERVER } from 'app/constants';
import controller, {
    addControllerEvents,
    removeControllerEvents,
} from 'app/lib/controller';
import store from 'app/store';
import { clearConsole, consoleWrite } from './consoleStore';
import type { ConsoleMessageType } from './definitions';

/**
 * Controller output arrives on one channel, so the only semantic signal it
 * carries is its own text. Classifying here keeps that parsing at the
 * ingestion boundary instead of in the row renderer.
 */
export function classifyControllerRead(data: string): ConsoleMessageType {
    if (data.includes('ALARM:')) {
        return 'alarm';
    }

    if (data.includes('error:')) {
        return 'error';
    }

    if (data.includes('[MSG:')) {
        return /\[MSG:\s*(WARN|WARNING)/i.test(data) ? 'warning' : 'system';
    }

    return 'response';
}

/**
 * A write is a line gSender put on the wire. Everything the controller is
 * asked to execute is G-code; what the server says about itself is not.
 */
export function classifyControllerWrite(source?: string): ConsoleMessageType {
    return source === WRITE_SOURCE_SERVER ? 'system' : 'gcode';
}

// A window can be told a port is open more than once - joining a connection
// makes the server send its own 'serialport:open' back. The banner belongs to
// the connection, not to each of those notifications.
let announcedPort: string | null = null;

const controllerEvents = {
    'serialport:open': ({
        port,
        baudrate,
    }: {
        port: string;
        baudrate: number;
    }) => {
        if (announcedPort === port) {
            return;
        }
        announcedPort = port;

        consoleWrite(`gSender - [${controller.type}]`, 'system');
        consoleWrite(
            `Connected to ${port} with a baud rate of ${baudrate}`,
            'system',
        );

        const { DEFAULT, ROTARY } = WORKSPACE_MODE;

        if (controller.type === 'grblHAL') {
            const isRotaryMode =
                store.get('workspace.mode', DEFAULT) === ROTARY;
            controller.command('updateRotaryMode', isRotaryMode);
        }
    },
    // Matches the old terminal: each connection starts with a clean console.
    'serialport:close': () => {
        announcedPort = null;
        clearConsole();
    },
    'serialport:write': (data: string, context: { source?: string }) => {
        const { source } = context ?? {};

        let line = String(data).trim();
        // Handle non-ascii characters more gracefully
        line = line.replace(/[^\x20-\x7E]/g, (m) => {
            return '\\x' + m.charCodeAt(0).toString(16);
        });

        consoleWrite(line, classifyControllerWrite(source));
    },
    'serialport:read': (data: string) => {
        const line = String(data).trim();
        consoleWrite(line, classifyControllerRead(line));
    },
};

let subscriberCount = 0;

/**
 * Started by whichever console views are mounted. The listeners are attached
 * once per renderer regardless of how many views there are, so the embedded
 * console and the pop-out render from the same stream.
 */
export function startConsoleIngest(): () => void {
    subscriberCount += 1;

    if (subscriberCount === 1) {
        addControllerEvents(controllerEvents);
    }

    let released = false;

    return () => {
        if (released) {
            return;
        }
        released = true;

        subscriberCount -= 1;

        if (subscriberCount === 0) {
            removeControllerEvents(controllerEvents);
        }
    };
}
