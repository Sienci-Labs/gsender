import cx from 'classnames';
import { neutral } from '../../messages/styles';

export function StepsList({ steps }: { steps: string[] }) {
    return (
        <div className="flex flex-col gap-2.5">
            <span
                className={cx(
                    'text-xs font-bold uppercase tracking-wider',
                    neutral.muted,
                )}
            >
                Try this
            </span>
            <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
                {steps.map((step, i) => (
                    <li key={i} className="flex items-center gap-3">
                        <span
                            className={cx(
                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold',
                                neutral.panel,
                                neutral.title,
                            )}
                        >
                            {i + 1}
                        </span>
                        <span className={cx('text-sm', neutral.body)}>
                            {step}
                        </span>
                    </li>
                ))}
            </ol>
        </div>
    );
}
