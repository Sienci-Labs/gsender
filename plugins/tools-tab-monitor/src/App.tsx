import { useEffect, useRef, useState } from 'react';

// This plugin isn't a real feature — it's a manual test aid for gSender's
// "Carve Tools widget re-renders remount plugin tabs" fix. Everything on
// screen is designed to make one thing obvious: did this tab's iframe stay
// the exact same one, or did it just get torn down and rebuilt?

const MOUNT_COUNT_KEY = 'tools-tab-monitor:mount-count';

// A real remount recreates this iframe's DOM node, which the browser treats
// like navigating this document fresh — so any in-memory React state (the
// text box, the clock, the log below) is wiped, exactly like the bug this
// plugin exists to catch. localStorage is scoped to this iframe's origin,
// not to any one DOM node or JS execution, so it's the one thing here that
// survives a real remount — which is exactly what makes it useful as the
// "ground truth" count to compare everything else against.
const readMountCount = (): number => {
    try {
        return Number.parseInt(
            window.localStorage.getItem(MOUNT_COUNT_KEY) ?? '0',
            10,
        );
    } catch {
        // A locked-down frame can throw on storage access — fall back to 0
        // rather than crash the plugin.
        return 0;
    }
};

const writeMountCount = (value: number) => {
    try {
        window.localStorage.setItem(MOUNT_COUNT_KEY, String(value));
    } catch {
        // best-effort only
    }
};

const formatClock = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const LOG_LIMIT = 20;

const App = () => {
    // useState's initializer runs exactly once, at the moment this component
    // instance is created — i.e. once per real mount. (In a dev-mode
    // `npm run dev` preview outside gSender, React's StrictMode intentionally
    // double-invokes this and the count will climb by 2 per reload instead
    // of 1 — that's a React StrictMode quirk of the dev server, not this
    // plugin. It doesn't happen in the built `ui/` bundle gSender actually
    // loads, which is always a production React build.)
    const [mountCount] = useState(() => {
        const next = readMountCount() + 1;
        writeMountCount(next);
        return next;
    });

    const [text, setText] = useState('');
    const [seconds, setSeconds] = useState(0);
    const [log, setLog] = useState<string[]>([]);
    const loadedAt = useRef(new Date());

    useEffect(() => {
        const id = window.setInterval(() => {
            setSeconds((prev) => prev + 1);
            setLog((prev) => {
                const line = `still the same mount — ${prev.length + 1}s and counting`;
                return [...prev.slice(-(LOG_LIMIT - 1)), line];
            });
        }, 1000);

        return () => window.clearInterval(id);
    }, []);

    return (
        <main className="app">
            <header>
                <h1>Tools Tab Monitor</h1>
                <p className="lede">
                    A manual test aid, not a real feature. Everything below
                    should stay exactly as you left it while you switch tabs,
                    resize the window, or navigate elsewhere in gSender and come
                    back. If any of it resets, this tab's iframe just got torn
                    down and rebuilt.
                </p>
            </header>

            <section className="card counter">
                <h2>Mount count</h2>
                <p className="hint">
                    Stored in this iframe's own <code>localStorage</code>, so it
                    only survives a genuine reload of this tab — the only thing
                    here that can prove a remount happened even if you weren't
                    watching when it did.
                </p>
                <p className="big-number">{mountCount}</p>
                <p className="instruction">
                    This number must not change unless you actually reload
                    gSender. Switch to another tab and back, open Settings and
                    return, resize the window — then check it's still the same.
                </p>
                <button type="button" onClick={() => writeMountCount(0)}>
                    Reset counter (takes effect next reload)
                </button>
            </section>

            <section className="card">
                <h2>Type something</h2>
                <p className="hint">
                    Plain React state — unlike the counter above, this is wiped
                    instantly by a remount.
                </p>
                <input
                    id="remount-check-input"
                    type="text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Type here, switch tabs, then come back"
                />
            </section>

            <section className="card">
                <h2>Alive for {formatClock(seconds)}</h2>
                <p className="hint">
                    Ticking once a second since this mount loaded at{' '}
                    {loadedAt.current.toLocaleTimeString()}. A reset back to
                    0:00, or a jump in the timestamp above, means a remount just
                    happened.
                </p>
                <ul className="log" aria-live="polite">
                    {log.length === 0 && (
                        <li className="log-empty">
                            waiting for the first tick…
                        </li>
                    )}
                    {log.map((line, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <li key={index}>{line}</li>
                    ))}
                </ul>
            </section>
        </main>
    );
};

export default App;
