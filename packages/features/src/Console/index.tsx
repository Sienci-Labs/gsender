import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { store } from '@gsender/controller-client/store/redux';
import { clearHistory, addToInputHistory } from '@gsender/controller-client/store/redux/slices/console.slice';
import controller from '@gsender/controller-client/controller';

type Props = {
    className?: string;
};

function lineColor(line: string): string {
    if (/error:/i.test(line) || /ALARM:/i.test(line)) {
        return 'text-red-400';
    }
    return 'text-gray-500 dark:text-gray-300';
}

export default function ConsolePanel({ className = '' }: Props) {
    const history = useTypedSelector((s: RootState) => s.console.history);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const send = () => {
        const cmd = input.trim();
        if (!cmd) return;
        controller.writeln(cmd);
        store.dispatch(addToInputHistory(cmd));
        setInput('');
    };

    const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') send();
    };

    const clear = () => store.dispatch(clearHistory());

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Output */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                {history.length === 0 ? (
                    <p className="font-mono text-xs text-gray-400 dark:text-gray-500 italic">
                        No output yet
                    </p>
                ) : (
                    history.map((line, i) => (
                        <p
                            key={i}
                            className={`font-mono text-xs leading-snug whitespace-pre-wrap break-all ${lineColor(line)}`}
                        >
                            {line}
                        </p>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 dark:border-white/10 shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Send command…"
                    className="flex-1 min-w-0 bg-transparent font-mono text-xs text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
                />
                <button
                    onClick={send}
                    disabled={!input.trim()}
                    className="shrink-0 px-3 py-1 text-xs font-medium rounded bg-robin-500 text-white disabled:opacity-40 disabled:cursor-default"
                >
                    Send
                </button>
                <button
                    onClick={clear}
                    className="shrink-0 px-2 py-1 text-xs font-medium rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}
