import type {
    CameraView,
    OverlayMarker,
    ViewerPickEvent,
} from '@sienci/gsender-plugin-sdk';
import { machine, viewer } from '@sienci/gsender-plugin-sdk';
import { useVisualizerPick } from '@sienci/gsender-plugin-sdk/react';
import { useEffect, useState } from 'react';

const CAMERA_VIEWS: { view: CameraView; label: string }[] = [
    { view: 'top', label: 'Top' },
    { view: '3d', label: '3D' },
    { view: 'front', label: 'Front' },
    { view: 'left', label: 'Left' },
    { view: 'right', label: 'Right' },
];

type Point3 = { x: number; y: number; z: number };
type Point2 = { x: number; y: number };
type LastPick = { world: Point3; screen: Point2 };

const distance = (a: OverlayMarker, b: OverlayMarker) =>
    Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));

const errorMessage = (err: unknown) =>
    err instanceof Error ? err.message : String(err);

// a reference plugin exercising every method on `gsender.viewer.*` plus `machine.setBusy`
const App = () => {
    const [corners, setCorners] = useState<OverlayMarker[]>([]);
    const [extras, setExtras] = useState<OverlayMarker[]>([]);
    const [lastPick, setLastPick] = useState<LastPick | null>(null);
    const [worldFromScreen, setWorldFromScreen] = useState<Point3 | null>(null);
    const [screenFromWorld, setScreenFromWorld] = useState<Point2 | null>(null);
    const [pickingEnabled, setPickingEnabled] = useState(true);
    const [quickLocateWaiting, setQuickLocateWaiting] = useState(false);
    const [locked, setLocked] = useState(false);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState('');

    // redraw the host visualizer's overlay every time our marker lists change
    useEffect(() => {
        void viewer.setOverlay([...corners, ...extras]);
    }, [corners, extras]);

    // leave nothing drawn on the visualizer if this panel goes away
    useEffect(() => {
        return () => {
            void viewer.setOverlay([]);
        };
    }, []);

    const addCorner = (event: ViewerPickEvent) => {
        if (event.kind !== 'pick') {
            return;
        }
        setLastPick({ world: event.world, screen: event.screen });
        setCorners((prev) => [
            ...prev,
            {
                id: `corner-${prev.length + 1}-${prev.length}`,
                x: event.world.x,
                y: event.world.y,
                z: event.world.z,
                shape: 'circle',
                label: String(prev.length + 1),
            },
        ]);
    };

    // continuously armed while this panel is open (unless quick locate
    // is borrowing the pick, in which case `pickingEnabled` disables it)
    const { armed, error } = useVisualizerPick('click', addCorner, {
        enabled: pickingEnabled,
    });

    const clearAll = () => {
        setCorners([]);
        setExtras([]);
        setLastPick(null);
        setWorldFromScreen(null);
        setScreenFromWorld(null);
    };

    const setCamera = async (view: CameraView) => {
        try {
            await viewer.camera.set(view);
        } catch (err) {
            setStatus(errorMessage(err));
        }
    };

    const toggleLockRotate = async (checked: boolean) => {
        setLocked(checked);
        try {
            await viewer.camera.lockRotate(checked);
        } catch (err) {
            setStatus(errorMessage(err));
        }
    };

    // arm a single click, drop a marker, snap the camera to top, then dispose
    const quickLocate = () => {
        setPickingEnabled(false);
        setQuickLocateWaiting(true);
        setStatus('Click a point on the visualizer…');
    };

    useEffect(() => {
        // wait till visualizerPick lets go of the arm (aka arm is false) before doing this
        // otherwise you will get a deadlock and you won't be able
        // to put corners or quick locate anymore
        if (!quickLocateWaiting || armed) {
            return;
        }
        setQuickLocateWaiting(false);

        let cancelled = false;

        (async () => {
            try {
                const dispose = await viewer.armPick('click', (event) => {
                    if (event.kind !== 'pick') {
                        return;
                    }
                    setLastPick({ world: event.world, screen: event.screen });
                    setExtras((prev) => [
                        ...prev,
                        {
                            id: `quick-${prev.length}`,
                            x: event.world.x,
                            y: event.world.y,
                            z: event.world.z,
                            shape: 'cross',
                            color: '#f0f',
                            label: 'quick',
                        },
                    ]);
                    void viewer.camera.set('top');
                    dispose();
                    setPickingEnabled(true);
                    setStatus('Located.');
                });
                if (cancelled) {
                    dispose();
                }
            } catch (err) {
                if (!cancelled) {
                    setStatus(errorMessage(err));
                    setPickingEnabled(true);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [quickLocateWaiting, armed]);

    // round-trips the last pick's own screen/world pair through both projection methods
    const checkRoundTrip = async () => {
        if (!lastPick) {
            return;
        }
        try {
            const [world, screen] = await Promise.all([
                viewer.screenToWorld(lastPick.screen.x, lastPick.screen.y),
                viewer.worldToScreen(
                    lastPick.world.x,
                    lastPick.world.y,
                    lastPick.world.z,
                ),
            ]);
            setWorldFromScreen(world);
            setScreenFromWorld(screen);
        } catch (err) {
            setStatus(errorMessage(err));
        }
    };

    // flags the machine busy for the span of a (simulated) feeder-driven
    // operation, releasing it in `finally` regardless of how the work ends
    const simulateOperation = async () => {
        setBusy(true);
        setStatus('');
        try {
            await machine.setBusy(true, 'Marking corners…');
            const last = corners[corners.length - 1];
            if (last) {
                const screen = await viewer.worldToScreen(
                    last.x,
                    last.y,
                    last.z,
                );
                setScreenFromWorld(screen);
            }
            setStatus('Operation complete.');
        } catch (err) {
            setStatus(errorMessage(err));
        } finally {
            await machine.setBusy(false);
            setBusy(false);
        }
    };

    const lastTwo = corners.slice(-2);
    const lastDistance =
        lastTwo.length === 2 ? distance(lastTwo[0], lastTwo[1]) : null;

    return (
        <main className="app">
            <header>
                <h1>Corner Finder</h1>
                <p className="lede">
                    Reference plugin for <code>gsender.viewer.*</code> and{' '}
                    <code>machine.setBusy</code>.
                </p>
            </header>

            <section className="card">
                <h2>Pick corners</h2>
                <p className="hint">
                    <code>useVisualizerPick("click", …)</code> — click points on
                    the visualizer; each pick drops a numbered marker via{' '}
                    <code>viewer.setOverlay()</code>
                </p>
                <p className="readout">
                    {error ? (
                        <span className="error">Can&apos;t pick: {error}</span>
                    ) : (
                        <>Picking: {armed ? 'armed' : 'arming…'}</>
                    )}
                </p>
                <p className="readout">Corners: {corners.length}</p>
                {lastDistance !== null && (
                    <p className="readout">
                        Distance between last two corners:{' '}
                        <strong>{lastDistance.toFixed(2)}</strong>
                    </p>
                )}
                <div className="row">
                    <button
                        type="button"
                        onClick={quickLocate}
                        disabled={!pickingEnabled}
                    >
                        Quick locate
                    </button>
                    <button type="button" onClick={clearAll}>
                        Clear markers
                    </button>
                </div>
            </section>

            <section className="card">
                <h2>Camera</h2>
                <p className="hint">
                    <code>viewer.camera.set()</code> /{' '}
                    <code>viewer.camera.lockRotate()</code>
                </p>
                <div className="row">
                    {CAMERA_VIEWS.map(({ view, label }) => (
                        <button
                            key={view}
                            type="button"
                            onClick={() => setCamera(view)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <label className="checkbox readout">
                    <input
                        type="checkbox"
                        checked={locked}
                        onChange={(event) =>
                            toggleLockRotate(event.target.checked)
                        }
                    />
                    Lock rotation
                </label>
            </section>

            <section className="card">
                <h2>Screen ⇄ world round-trip</h2>
                <p className="hint">
                    <code>viewer.screenToWorld()</code> /{' '}
                    <code>viewer.worldToScreen()</code> on the last pick
                </p>
                <button
                    type="button"
                    onClick={checkRoundTrip}
                    disabled={!lastPick}
                >
                    Check round-trip
                </button>
                {worldFromScreen && (
                    <p className="readout">
                        screenToWorld(last pick&apos;s screen) ={' '}
                        {worldFromScreen.x.toFixed(2)},{' '}
                        {worldFromScreen.y.toFixed(2)}
                    </p>
                )}
                {screenFromWorld && (
                    <p className="readout">
                        worldToScreen(last pick&apos;s world) ={' '}
                        {screenFromWorld.x.toFixed(0)},{' '}
                        {screenFromWorld.y.toFixed(0)}
                    </p>
                )}
            </section>

            <section className="card">
                <h2>Busy latch</h2>
                <p className="hint">
                    <code>machine.setBusy(true, label)</code> — stable status
                    pill through a feeder-driven op, released in{' '}
                    <code>finally</code>
                </p>
                <button
                    type="button"
                    className="primary"
                    onClick={simulateOperation}
                    disabled={busy}
                >
                    {busy ? 'Running…' : 'Simulate operation'}
                </button>
            </section>

            {status && <p className="status">{status}</p>}
        </main>
    );
};

export default App;
