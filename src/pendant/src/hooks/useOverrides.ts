import { METRIC_UNITS, SPINDLE_MODE } from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import controller from 'app/lib/controller';
import { mapPositionToUnits } from 'app/lib/units';
import store from 'app/store';
import type { RootState } from 'app/store/redux';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import { useEffect, useState } from 'react';

// Feed / spindle override plumbing from FeedOverrideWrapper, shared with the
// carve screen's faders. Module-level so every caller shares one debounce.

export const sendFeedOverride = debounce(
    (v: number) => controller.command('feedOverride', v),
    750,
);
export const sendSpindleOverride = debounce(
    (v: number) => controller.command('spindleOverride', v),
    1000,
);

let globalOvTimestamp = 0;
let globalLocalOvFTimestamp = 0;
let globalLocalOvSTimestamp = 0;

const debouncedOvFUpdate = debounce((ovF: number, set: (v: number) => void) => {
    if (globalOvTimestamp > globalLocalOvFTimestamp) set(ovF);
}, 1000);
const debouncedOvSUpdate = debounce((ovS: number, set: (v: number) => void) => {
    if (globalOvTimestamp > globalLocalOvSTimestamp) set(ovS);
}, 1000);

const readSpindleLabel = () =>
    store.get('widgets.spindle.mode', SPINDLE_MODE) === SPINDLE_MODE
        ? 'Spindle'
        : 'Laser';

export function useOverrides() {
    const status = useTypedSelector((s: RootState) =>
        get(s, 'controller.state.status', {}),
    ) as any;
    const isConnected = useTypedSelector(
        (s: RootState) => s.connection.isConnected,
    );
    const { units, spindleFunctions } = useWorkspaceState();

    const [spindleLabel, setSpindleLabel] = useState(() =>
        store.get('widgets.spindle.mode') === SPINDLE_MODE
            ? 'Spindle'
            : 'Laser',
    );

    useEffect(() => {
        const handler = () => setSpindleLabel(readSpindleLabel());
        store.on('change', handler);
        return () => {
            store.removeListener('change', handler);
        };
    }, []);

    const ov: number[] = status.ov ?? [100, 100, 100];
    const ovF = ov[0];
    const ovR = ov[1];
    const ovS = ov[2];
    const ovTimestamp = status.ovTimestamp ?? 0;
    let feedrate = status.feedrate ?? '0';
    const spindle = status.spindle ?? '0';

    globalOvTimestamp = ovTimestamp;

    const [localOvF, setLocalOvF] = useState(ovF);
    const [localOvS, setLocalOvS] = useState(ovS);

    useEffect(() => {
        debouncedOvFUpdate(ovF, setLocalOvF);
    }, [ovF]);
    useEffect(() => {
        debouncedOvSUpdate(ovS, setLocalOvS);
    }, [ovS]);

    const unitString = `${units}/min`;
    if (units !== METRIC_UNITS) feedrate = mapPositionToUnits(feedrate, units);

    /** Local-only update while dragging. */
    const previewFeed = (v: number) => {
        setLocalOvF(v);
        globalLocalOvFTimestamp = Date.now();
    };
    const previewSpindle = (v: number) => {
        setLocalOvS(v);
        globalLocalOvSTimestamp = Date.now();
    };
    /** Local update plus a (debounced) send, for taps and resets. */
    const commitFeed = (v: number) => {
        previewFeed(v);
        sendFeedOverride(v);
    };
    const commitSpindle = (v: number) => {
        previewSpindle(v);
        sendSpindleOverride(v);
    };

    return {
        isConnected,
        spindleFunctions,
        spindleLabel,
        unitString,
        feedrate,
        spindle,
        ovR,
        localOvF,
        localOvS,
        previewFeed,
        previewSpindle,
        commitFeed,
        commitSpindle,
    };
}
