import * as DialogPrimitive from '@radix-ui/react-dialog';
import cx from 'classnames';
import { X } from 'lucide-react';
import { getEyebrow } from '../../messages/normalize';
import { neutral, severity } from '../../messages/styles';
import type { NormalizedHelperMessage } from '../../messages/types';
import { SeverityBadge } from './SeverityBadge';

interface Props {
    message: NormalizedHelperMessage;
}

function CloseButton() {
    return (
        <DialogPrimitive.Close
            aria-label="Close"
            data-helper-focus="close"
            className={cx(
                'ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-overlay-hover',
                neutral.muted,
            )}
        >
            <X size={20} />
        </DialogPrimitive.Close>
    );
}

export function MessageHeader({ message }: Props) {
    const { kind, weight } = message;
    const { fg, tint, line } = severity({ kind });
    const isFull = weight === 'full';

    return (
        <div
            className={cx(
                'flex shrink-0 items-center gap-3.5',
                isFull
                    ? ['border-b px-6 py-4', tint(), line()]
                    : 'pb-3.5 pl-[22px] pr-3.5 pt-[18px]',
            )}
        >
            <SeverityBadge kind={kind} size={isFull ? 'lg' : 'md'} />
            <div className="flex min-w-0 flex-col">
                <span
                    className={cx(
                        'text-xs font-bold uppercase tracking-wider',
                        { 'font-mono': isFull },
                        fg(),
                    )}
                >
                    {getEyebrow(message)}
                </span>
                <DialogPrimitive.Title
                    className={cx(
                        'm-0 font-bold leading-tight',
                        isFull ? 'text-[22px]' : 'text-[19px]',
                        neutral.title,
                    )}
                >
                    {message.title}
                </DialogPrimitive.Title>
            </div>
            <CloseButton />
        </div>
    );
}
