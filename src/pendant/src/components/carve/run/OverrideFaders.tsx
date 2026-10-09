import cn from 'classnames';
import { useOverrides } from '../../../hooks/useOverrides';
import IsoFader from './IsoFader';

/** Feed plus Spindle (or laser Power) faders, side by side. */
export default function OverrideFaders({
    fill = true,
}: {
    /** Grow the cards into the spare height of the column; off keeps the
     * fixed-height track. */
    fill?: boolean;
}) {
    const {
        isConnected,
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
    const isLaser = spindleLabel === 'Laser';

    return (
        <div
            className={cn(
                'flex justify-center gap-2 pt-1 pb-0.5',
                // min-h-fit: never squeeze below the tracks' minimum, so a
                // short scrolling tab scrolls instead
                fill ? 'ovr-fill flex-1 min-h-fit' : 'items-center shrink-0',
            )}
        >
            <IsoFader
                kind="feed"
                chip="F"
                title="Feed"
                value={localOvF}
                sub={`F${Math.round(Number(feedrate) || 0)} ${unitString}`}
                disabled={!isConnected}
                onPreview={previewFeed}
                onCommit={commitFeed}
            />
            {/* Always shown, regardless of the workspace's spindleFunctions */}
            <IsoFader
                kind={isLaser ? 'laser' : 'spindle'}
                chip={isLaser ? 'P' : 'S'}
                title={isLaser ? 'Power' : 'Spindle'}
                value={localOvS}
                sub={isLaser ? 'Laser power' : `${spindle} RPM`}
                disabled={!isConnected}
                onPreview={previewSpindle}
                onCommit={commitSpindle}
            />
        </div>
    );
}
