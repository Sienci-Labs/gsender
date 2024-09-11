import cn from 'classnames';

export interface LabelProps {
    children?: React.ReactNode;
    className?: string;
}

export function Label(props: LabelProps) {
    return (
        <span className={cn('text-sm text-gray-400', props.className)}>
            {props.children}
        </span>
    );
}
