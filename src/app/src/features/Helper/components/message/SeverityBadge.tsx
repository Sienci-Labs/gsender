import cx from 'classnames';
import { KIND_META, severity } from '../../messages/styles';
import type { HelperKind } from '../../messages/types';

interface Props {
    kind: HelperKind;
    // 'lg' for the full weight header band, 'md' for compact/minimal
    size?: 'lg' | 'md';
}

export function SeverityBadge({ kind, size = 'lg' }: Props) {
    const { fg, tint, line } = severity({ kind });
    const Icon = KIND_META[kind].icon;

    return (
        <div
            aria-hidden="true"
            className={cx(
                'flex shrink-0 items-center justify-center rounded-md border',
                size === 'lg' ? 'h-12 w-12' : 'h-10 w-10',
                fg(),
                tint(),
                line(),
            )}
        >
            <Icon size={size === 'lg' ? 24 : 21} />
        </div>
    );
}
