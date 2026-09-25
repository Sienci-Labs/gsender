import cx from 'classnames';
import { neutral, severity } from '../../messages/styles';
import type { HelperKind, HelperProgress } from '../../messages/types';

interface Props {
    kind: HelperKind;
    progress: HelperProgress;
}

// Plain track/fill rather than shadcn Progress, whose indicator colour is fixed
export function ProgressBlock({ kind, progress }: Props) {
    const { label, value, max, unit } = progress;
    const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    const suffix = unit ? ` ${unit}` : '';

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
                <span className={cx('text-sm', neutral.muted)}>{label}</span>
                <span className={cx('font-mono text-sm', neutral.title)}>
                    {value}
                    {suffix} / {max}
                    {suffix}
                </span>
            </div>
            <div
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={value}
                className={cx('h-2 w-full overflow-hidden rounded-full', neutral.track)}
            >
                <div
                    className={cx('h-full rounded-full', severity({ kind }).bar())}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
