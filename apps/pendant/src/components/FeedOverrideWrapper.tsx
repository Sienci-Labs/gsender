import { useEffect, useState } from 'react';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import RangeSlider from '@gsender/ui/primitives/RangeSlider';
import controller from '@gsender/controller-client/controller';
import store from 'app/store';
import { mapPositionToUnits } from 'app/lib/units';
import {
    METRIC_UNITS,
    OVERRIDE_VALUE_RANGES,
    SPINDLE_MODE,
} from 'app/constants';

const debouncedFeed    = debounce((v: number) => controller.command('feedOverride', v), 750);
const debouncedSpindle = debounce((v: number) => controller.command('spindleOverride', v), 1000);

let globalOvTimestamp      = 0;
let globalLocalOvFTimestamp = 0;
let globalLocalOvSTimestamp = 0;

const debouncedOvFUpdate = debounce((ovF: number, set: (v: number) => void) => {
    if (globalOvTimestamp > globalLocalOvFTimestamp) set(ovF);
}, 1000);
const debouncedOvSUpdate = debounce((ovS: number, set: (v: number) => void) => {
    if (globalOvTimestamp > globalLocalOvSTimestamp) set(ovS);
}, 1000);

export default function FeedOverrideWrapper() {
    const status      = useTypedSelector((s: RootState) => get(s, 'controller.state.status', {})) as any;
    const isConnected = useTypedSelector((s: RootState) => s.connection.isConnected);
    const { units, spindleFunctions } = useWorkspaceState();

    const [spindleLabel, setSpindleLabel] = useState(
        store.get('widgets.spindle.mode') === SPINDLE_MODE ? 'Spindle' : 'Laser',
    );

    useEffect(() => {
        const handler = () => {
            setSpindleLabel(
                store.get('widgets.spindle.mode', SPINDLE_MODE) === SPINDLE_MODE ? 'Spindle' : 'Laser',
            );
        };
        store.on('change', handler);
        return () => { store.removeListener('change', handler); };
    }, []);

    const ov: number[]   = status.ov ?? [100, 100, 100];
    const ovF            = ov[0];
    const ovS            = ov[2];
    const ovTimestamp    = status.ovTimestamp ?? 0;
    let   feedrate       = status.feedrate ?? '0';
    const spindle        = status.spindle ?? '0';

    globalOvTimestamp = ovTimestamp;

    const [localOvF, setLocalOvF] = useState(ovF);
    const [localOvS, setLocalOvS] = useState(ovS);

    useEffect(() => { debouncedOvFUpdate(ovF, setLocalOvF); }, [ovF]);
    useEffect(() => { debouncedOvSUpdate(ovS, setLocalOvS); }, [ovS]);

    const unitString = `${units}/min`;
    if (units !== METRIC_UNITS) feedrate = mapPositionToUnits(feedrate, units);

    return (
        <div className={spindleFunctions ? 'grid grid-cols-1 grid-rows-2 gap-4' : 'flex justify-center items-center'}>
            <RangeSlider
                id="feed-override"
                step={10}
                min={OVERRIDE_VALUE_RANGES.MIN}
                max={OVERRIDE_VALUE_RANGES.MAX}
                value={feedrate}
                percentage={[localOvF]}
                defaultPercentage={[100]}
                showText
                title="Feed"
                unitString={unitString}
                colour={isConnected ? 'bg-blue-400' : 'bg-gray-500'}
                disabled={!isConnected}
                onChange={(vals) => { setLocalOvF(vals[0]); globalLocalOvFTimestamp = Date.now(); }}
                onButtonPress={(vals) => { setLocalOvF(vals[0]); globalLocalOvFTimestamp = Date.now(); debouncedFeed(vals[0]); }}
                onLostPointerCapture={() => { debouncedFeed(localOvF); }}
            />
            {spindleFunctions && (
                <RangeSlider
                    id="spindle-override"
                    step={10}
                    min={OVERRIDE_VALUE_RANGES.MIN}
                    max={OVERRIDE_VALUE_RANGES.MAX}
                    value={spindle}
                    percentage={[localOvS]}
                    defaultPercentage={[100]}
                    showText
                    title={spindleLabel}
                    unitString={spindleLabel === 'Laser' ? 'Power' : 'RPM'}
                    colour={isConnected ? (spindleLabel === 'Laser' ? 'bg-purple-400' : 'bg-red-400') : 'bg-gray-500'}
                    disabled={!isConnected}
                    onChange={(vals) => { setLocalOvS(vals[0]); globalLocalOvSTimestamp = Date.now(); }}
                    onButtonPress={(vals) => { setLocalOvS(vals[0]); globalLocalOvSTimestamp = Date.now(); debouncedSpindle(vals[0]); }}
                    onPointerUp={() => { debouncedSpindle(localOvS); }}
                />
            )}
        </div>
    );
}
