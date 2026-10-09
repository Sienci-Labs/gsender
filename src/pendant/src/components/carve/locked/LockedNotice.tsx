import cn from 'classnames';
import { Pause, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

/** Left-column notice while Alarm or a job-less Hold locks the screen. */
export default function LockedNotice({
    tone,
    children,
    footer,
}: {
    tone: 'alarm' | 'hold';
    children: ReactNode;
    /** Extra content under the reason, e.g. the alarm's guide QR. */
    footer?: ReactNode;
}) {
    const Icon = tone === 'alarm' ? TriangleAlert : Pause;
    return (
        <div className="flex flex-1 flex-col justify-center gap-2 p-3.5 text-left">
            <span
                className={cn(
                    'flex items-center gap-[7px] text-[12.5px] font-bold',
                    tone === 'alarm' ? 'text-state-alarm' : 'text-state-hold',
                )}
            >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden />
                {tone === 'alarm' ? 'Locked' : 'Held'}
            </span>
            <p className="m-0 text-[11px] leading-normal text-content-disabled">
                {children}
            </p>
            {footer && <div className="mt-2">{footer}</div>}
        </div>
    );
}
