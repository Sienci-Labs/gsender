import { JSX } from 'react';
import cn from 'classnames';
import { TiWarning } from 'react-icons/ti';
import { GrStatusGood } from 'react-icons/gr';
export interface ATCStatusButtonProps {
    statusPredicate: () => boolean;
    children: JSX.Element;
}

export function ATCStatusButton({
    children,
    statusPredicate,
    ...rest
}: ATCStatusButtonProps) {
    const predicate = statusPredicate();
    return (
        <button
            className={cn(
                'p-2 border text-white bg-blue-500 rounded-lg flex flex-row items-center gap-2',
                {
                    'bg-red-200 border-red-500 text-red-500': !predicate,
                },
            )}
            {...rest}
        >
            <span className={cn('text-lg', {})}>
                {predicate ? <GrStatusGood /> : <TiWarning />}
            </span>
            {children}
        </button>
    );
}
