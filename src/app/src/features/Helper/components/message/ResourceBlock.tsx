import { buttonStyle } from 'app/components/Button';
import cx from 'classnames';
import { ExternalLink } from 'lucide-react';
import QRCode from 'react-qr-code';
import { neutral } from '../../messages/styles';
import type { HelperResource } from '../../messages/types';

interface Props {
    resource: HelperResource;
    // column: landscape side column; row: portrait/full-width row;
    // inline: compact single row with a small QR and a text link
    variant: 'column' | 'row' | 'inline';
    className?: string;
}

const getDomain = (url: string) => {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

// Scanners need a light quiet zone, so the tile is white in both themes.
// The QR scales to its wrapper's width (the size prop only sets the viewBox).
function QrTile({ url, className }: { url: string; className: string }) {
    return (
        <div
            className={cx(
                'shrink-0 rounded-md border border-gray-200 bg-white p-1.5 dark:border-outline-subtle',
                className,
            )}
        >
            <QRCode
                value={url}
                size={256}
                level="M"
                style={{ height: 'auto', width: '100%', display: 'block' }}
            />
        </div>
    );
}

function OpenGuideButton({
    url,
    fullWidth,
}: {
    url: string;
    fullWidth?: boolean;
}) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            data-helper-focus="guide"
            className={buttonStyle({
                variant: 'primary',
                className: cx(
                    'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-base font-bold no-underline hover:text-white',
                    { 'w-full': fullWidth },
                ),
            })}
        >
            Open guide
            <ExternalLink size={15} />
        </a>
    );
}

export function ResourceBlock({ resource, variant, className }: Props) {
    const { url, label, link = true, qr = true } = resource;

    if (!link && !qr) {
        return null;
    }

    const domain = getDomain(url);

    if (variant === 'column') {
        return (
            <div
                className={cx(
                    'flex flex-col gap-3.5 self-start rounded-lg border p-[18px]',
                    neutral.panel,
                    className,
                )}
            >
                {qr && (
                    <div className="flex flex-col items-center gap-2">
                        <QrTile
                            url={url}
                            className="w-[156px] short:w-[120px]"
                        />
                        <span
                            className={cx('text-center text-xs', neutral.muted)}
                        >
                            Scan to open on your phone
                        </span>
                    </div>
                )}
                {link && (
                    <div className="flex flex-col gap-2.5">
                        <span
                            className={cx(
                                'text-center text-sm font-bold',
                                neutral.title,
                            )}
                        >
                            {label}
                        </span>
                        <OpenGuideButton url={url} fullWidth />
                        <span
                            className={cx('text-center text-xs', neutral.muted)}
                        >
                            {domain}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'row') {
        return (
            <div
                className={cx(
                    'flex items-center gap-[18px] rounded-lg border px-4 py-3.5',
                    neutral.panel,
                    className,
                )}
            >
                {qr && (
                    <div className="flex shrink-0 flex-col items-center gap-1.5">
                        <QrTile url={url} className="w-[120px]" />
                        <span className={cx('text-xs', neutral.muted)}>
                            Scan on phone
                        </span>
                    </div>
                )}
                <div className="flex min-w-0 flex-col items-start gap-1.5">
                    <span
                        className={cx(
                            'text-xs font-bold uppercase tracking-wider',
                            neutral.muted,
                        )}
                    >
                        Learn more
                    </span>
                    <span className={cx('text-base font-bold', neutral.title)}>
                        {label}
                    </span>
                    {link ? (
                        <>
                            <span className={cx('text-sm', neutral.muted)}>
                                {domain}
                            </span>
                            <OpenGuideButton url={url} />
                        </>
                    ) : (
                        <span className={cx('text-sm', neutral.muted)}>
                            Scan the code to open this guide on your phone.
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cx(
                'flex items-center gap-4 rounded-lg border px-3 py-3',
                neutral.panel,
                className,
            )}
        >
            {qr && <QrTile url={url} className="w-[68px]" />}
            <div className="flex min-w-0 flex-col gap-0.5">
                <span className={cx('text-[15px] font-bold', neutral.title)}>
                    {label}
                </span>
                {link ? (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-helper-focus="guide"
                        className={cx(
                            'inline-flex min-h-11 items-center gap-1.5 self-start font-bold no-underline',
                            neutral.link,
                        )}
                    >
                        Open guide
                        <ExternalLink size={13} />
                    </a>
                ) : (
                    <span className={cx('text-sm', neutral.muted)}>
                        Scan the code to open this guide on your phone.
                    </span>
                )}
            </div>
        </div>
    );
}
