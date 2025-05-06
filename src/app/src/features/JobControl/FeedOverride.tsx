import RangeSlider from 'app/components/RangeSlider';
import {
    METRIC_UNITS,
    OVERRIDE_VALUE_RANGES,
    SPINDLE_MODE,
} from '../../constants';
import controller from 'app/lib/controller';
import debounce from 'lodash/debounce';
import { useEffect, useState } from 'react';
import store from 'app/store';
import { UNITS_EN } from 'app/definitions/general';
import { mapPositionToUnits } from 'app/lib/units';

interface OverridesProps {
    ovF: number;
    ovS: number;
    feedrate: string;
    spindle: string;
    isConnected: boolean;
}

const debouncedSpindleHandler = debounce((value) => {
    controller.command('spindleOverride', Number(value));
}, 1000);
const debouncedFeedHandler = debounce((value) => {
    controller.command('feedOverride', Number(value));
}, 750);

const Overrides: React.FC<OverridesProps> = ({
    ovF,
    ovS,
    feedrate,
    spindle,
    isConnected,
}) => {
    const [showSpindleOverride, setShowSpindleOverride] = useState(
        store.get('workspace.spindleFunctions'),
    );
    const [spindleOverrideLabel, setSpindleOverrideLabel] = useState(
        store.get('widgets.spindle.mode') === SPINDLE_MODE
            ? 'Spindle'
            : 'Laser',
    );
    const [localOvF, setLocalOvF] = useState(ovF);
    const [localOvS, setLocalOvS] = useState(ovS);
    const units: UNITS_EN = store.get('workspace.units', METRIC_UNITS);

    const unitString = `${units}/min`;
    if (units !== METRIC_UNITS) {
        feedrate = mapPositionToUnits(feedrate, units);
    }

    const handleStoreChange = () => {
        setShowSpindleOverride(store.get('workspace.spindleFunctions'));
        setSpindleOverrideLabel(
            store.get('widgets.spindle.mode', SPINDLE_MODE) === SPINDLE_MODE
                ? 'Spindle'
                : 'Laser',
        );
    };

    useEffect(() => {
        store.on('change', handleStoreChange);

        return () => {
            store.removeListener('change', handleStoreChange);
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLocalOvF(ovF);
        }, 500);
        return () => clearTimeout(timer);
    }, [ovF]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLocalOvS(ovS);
        }, 500);
        return () => clearTimeout(timer);
    }, [ovS]);

    return (
        <div
            className={
                (showSpindleOverride
                    ? 'grid grid-cols-1 grid-rows-2 gap-4'
                    : 'flex justify-center items-center') + ' w-full'
            }
        >
            <RangeSlider
                step={10}
                min={OVERRIDE_VALUE_RANGES.MIN}
                max={OVERRIDE_VALUE_RANGES.MAX}
                value={feedrate}
                percentage={[localOvF]}
                defaultPercentage={[100]}
                showText={true}
                title="Feed"
                unitString={unitString}
                colour={isConnected ? 'bg-blue-400' : 'bg-gray-500'}
                disabled={!isConnected}
                onChange={(values) => {
                    setLocalOvF(values[0]);
                }}
                onButtonPress={(values) => {
                    setLocalOvF(values[0]);
                    debouncedFeedHandler(values[0]);
                }}
                onPointerUp={(_e) => {
                    debouncedFeedHandler(localOvF);
                }}
            />
            {showSpindleOverride && (
                <RangeSlider
                    step={10}
                    min={OVERRIDE_VALUE_RANGES.MIN}
                    max={OVERRIDE_VALUE_RANGES.MAX}
                    value={spindle}
                    percentage={[localOvS]}
                    defaultPercentage={[100]}
                    showText={true}
                    title={spindleOverrideLabel}
                    unitString={
                        spindleOverrideLabel === 'Laser' ? 'Power' : 'RPM'
                    }
                    colour={
                        isConnected
                            ? spindleOverrideLabel === 'Laser'
                                ? 'bg-purple-400'
                                : 'bg-red-400'
                            : 'bg-gray-500'
                    }
                    disabled={!isConnected}
                    onChange={(values) => {
                        setLocalOvS(values[0]);
                    }}
                    onButtonPress={(values) => {
                        setLocalOvS(values[0]);
                        debouncedSpindleHandler(values[0]);
                    }}
                    onPointerUp={(_e) => {
                        debouncedSpindleHandler(localOvS);
                    }}
                />
            )}
        </div>
    );
};

export default Overrides;
