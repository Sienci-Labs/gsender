import cx from 'classnames';
import { neutral } from '../../messages/styles';

export function RawCodeChip({ raw }: { raw: string }) {
    return (
        <span
            className={cx(
                'rounded border px-2 py-1 font-mono text-xs',
                neutral.panel,
                neutral.muted,
            )}
        >
            {raw}
        </span>
    );
}
