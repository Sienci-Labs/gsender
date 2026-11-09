import RangeSlider from 'app/components/RangeSlider';
import { OVERRIDE_VALUE_RANGES } from 'app/constants';
import {
    sendFeedOverride,
    sendSpindleOverride,
    useOverrides,
} from '../hooks/useOverrides';

export default function FeedOverrideWrapper() {
    const {
        isConnected,
        spindleFunctions,
        spindleLabel,
        unitString,
        feedrate,
        spindle,
        localOvF,
        localOvS,
        previewFeed,
        previewSpindle,
        commitFeed,
        commitSpindle,
    } = useOverrides();

    return (
        <div
            className={
                spindleFunctions
                    ? 'grid grid-cols-1 grid-rows-2 gap-4'
                    : 'flex justify-center items-center'
            }
        >
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
                onChange={(vals) => {
                    previewFeed(vals[0]);
                }}
                onButtonPress={(vals) => {
                    commitFeed(vals[0]);
                }}
                onLostPointerCapture={() => {
                    sendFeedOverride(localOvF);
                }}
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
                    colour={
                        isConnected
                            ? spindleLabel === 'Laser'
                                ? 'bg-purple-400'
                                : 'bg-red-400'
                            : 'bg-gray-500'
                    }
                    disabled={!isConnected}
                    onChange={(vals) => {
                        previewSpindle(vals[0]);
                    }}
                    onButtonPress={(vals) => {
                        commitSpindle(vals[0]);
                    }}
                    onPointerUp={() => {
                        sendSpindleOverride(localOvS);
                    }}
                />
            )}
        </div>
    );
}
