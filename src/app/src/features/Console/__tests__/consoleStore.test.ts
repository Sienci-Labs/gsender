import {
    CONSOLE_HISTORY_LIMIT,
    clearConsole,
    consoleWrite,
    flushConsoleWrites,
    getMessages,
    subscribe,
} from '../consoleStore';
import { matchesFilter } from '../definitions';

describe('consoleStore', () => {
    beforeEach(() => {
        clearConsole();
    });

    it('defaults untyped writes to response so existing call sites keep working', () => {
        consoleWrite('ok');
        flushConsoleWrites();

        expect(getMessages()).toEqual([
            expect.objectContaining({ message: 'ok', type: 'response' }),
        ]);
    });

    it('accepts both the object and positional write forms', () => {
        consoleWrite({ message: 'G0 X1', type: 'gcode' });
        consoleWrite('ALARM:10', 'alarm');
        flushConsoleWrites();

        expect(getMessages().map((item) => item.type)).toEqual([
            'gcode',
            'alarm',
        ]);
    });

    it('ignores empty writes', () => {
        consoleWrite('');
        flushConsoleWrites();

        expect(getMessages()).toHaveLength(0);
    });

    it('batches a burst into a single notification but keeps every line', () => {
        const listener = jest.fn();
        const unsubscribe = subscribe(listener);

        for (let i = 0; i < 200; i++) {
            consoleWrite(`G1 X${i}`, 'gcode');
        }

        // Nothing is published until the batch flushes.
        expect(listener).not.toHaveBeenCalled();

        flushConsoleWrites();

        expect(listener).toHaveBeenCalledTimes(1);
        expect(getMessages()).toHaveLength(200);
        // No collapsing into synthetic "200 lines" groups.
        expect(getMessages()[199].message).toBe('G1 X199');

        unsubscribe();
    });

    it('gives each line a distinct key so the virtualized list can track rows', () => {
        consoleWrite('ok', 'response');
        consoleWrite('ok', 'response');
        flushConsoleWrites();

        const [first, second] = getMessages();
        expect(first.id).not.toBe(second.id);
    });

    it('bounds history so a long job cannot grow memory without limit', () => {
        for (let i = 0; i < CONSOLE_HISTORY_LIMIT + 250; i++) {
            consoleWrite(`line ${i}`, 'gcode');
            // Flush periodically so trimming is exercised across batches.
            if (i % 100 === 0) {
                flushConsoleWrites();
            }
        }
        flushConsoleWrites();

        const messages = getMessages();
        expect(messages).toHaveLength(CONSOLE_HISTORY_LIMIT);
        // The newest lines survive, the oldest are dropped.
        expect(messages[messages.length - 1].message).toBe(
            `line ${CONSOLE_HISTORY_LIMIT + 249}`,
        );
        expect(messages[0].message).toBe('line 250');
    });

    it('caps the pending queue so a hidden window cannot grow it without bound', () => {
        // No flush in between: this is the backgrounded-window case, where the
        // flush timer is throttled while a job keeps streaming.
        for (let i = 0; i < CONSOLE_HISTORY_LIMIT * 3; i++) {
            consoleWrite(`line ${i}`, 'gcode');
        }
        flushConsoleWrites();

        const messages = getMessages();
        expect(messages).toHaveLength(CONSOLE_HISTORY_LIMIT);
        expect(messages[messages.length - 1].message).toBe(
            `line ${CONSOLE_HISTORY_LIMIT * 3 - 1}`,
        );
    });

    it('keeps a stable snapshot reference between flushes', () => {
        consoleWrite('ok', 'response');
        flushConsoleWrites();

        expect(getMessages()).toBe(getMessages());
    });

    it('drops queued writes when cleared', () => {
        consoleWrite('ok', 'response');
        clearConsole();
        flushConsoleWrites();

        expect(getMessages()).toHaveLength(0);
    });
});

describe('matchesFilter', () => {
    const message = (type: string) =>
        ({ id: '1', message: 'x', type }) as Parameters<
            typeof matchesFilter
        >[0];

    it('shows everything under all', () => {
        expect(matchesFilter(message('alarm'), 'all')).toBe(true);
        expect(matchesFilter(message('gcode'), 'all')).toBe(true);
    });

    it('groups every problem type under the faults filter', () => {
        expect(matchesFilter(message('warning'), 'faults')).toBe(true);
        expect(matchesFilter(message('error'), 'faults')).toBe(true);
        expect(matchesFilter(message('alarm'), 'faults')).toBe(true);
    });

    it('keeps ordinary traffic out of the faults filter', () => {
        expect(matchesFilter(message('gcode'), 'faults')).toBe(false);
        expect(matchesFilter(message('response'), 'faults')).toBe(false);
        expect(matchesFilter(message('system'), 'faults')).toBe(false);
    });

    it('matches remaining types exactly', () => {
        expect(matchesFilter(message('gcode'), 'gcode')).toBe(true);
        expect(matchesFilter(message('response'), 'gcode')).toBe(false);
        expect(matchesFilter(message('system'), 'system')).toBe(true);
    });
});
