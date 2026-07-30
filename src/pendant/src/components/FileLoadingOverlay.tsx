interface Props {
    fileName: string;
    progress: number;
}

const LINE_WIDTHS = [92, 61, 83, 50, 74, 66];
const LINE_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500'];
const SEGMENT_COUNT = 20;

function segmentColor(index: number, filled: boolean): string {
    if (!filled) return 'bg-surface-raised';
    if (index < 10) return 'bg-blue-500';
    if (index < 16) return 'bg-green-500';
    return 'bg-orange-500';
}

export default function FileLoadingOverlay({ fileName, progress }: Props) {
    const pct = `${Math.floor(progress)}%`;
    const filledSegments = Math.floor((progress / 100) * SEGMENT_COUNT);
    const shortName = fileName.length > 28 ? `…${fileName.slice(-26)}` : fileName;

    return (
        <div className="w-full min-h-[110px] rounded-xl border border-dashed border-outline-subtle bg-surface-sunken flex flex-col gap-3 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-content-muted truncate max-w-[70%]">{shortName || 'loading…'}</span>
                <span className="font-mono text-xs text-content-primary tabular-nums">{pct}</span>
            </div>

            {/* G-code line simulation */}
            <div className="flex flex-col gap-[3px]">
                {LINE_WIDTHS.map((maxWidth, i) => {
                    const lineProgress = Math.max(0, progress - i * 10);
                    const fillPct = Math.min(maxWidth, (lineProgress / (100 - i * 10)) * maxWidth);
                    return (
                        <div key={i} className="h-[5px] rounded-sm bg-surface-raised w-full">
                            <div
                                className={`h-full rounded-sm transition-all duration-100 ${LINE_COLORS[i]}`}
                                style={{ width: `${fillPct}%` }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Segmented progress bar */}
            <div className="flex gap-[2px]">
                {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
                    <div
                        key={i}
                        className={`flex-1 h-[5px] rounded-sm transition-colors duration-100 ${segmentColor(i, i < filledSegments)}`}
                    />
                ))}
            </div>

            {/* Footer */}
            <div className="flex justify-end">
                <span className="text-[10px] text-content-muted">building toolpath...</span>
            </div>
        </div>
    );
}
