import cn from 'classnames';

export interface IconFunctionButtonProps {
    onClick?: () => void;
    icon: JSX.Element;
    label: string;
    disabled?: boolean;
}

export function IconFunctionButton({
    onClick,
    icon,
    label,
    disabled,
}: IconFunctionButtonProps): JSX.Element {
    return (
        <button
            className={cn(
                'flex flex-col gap-2 items-center justify-center border bg-gray-100 p-2 rounded w-20 fill-blue-500 text-blue-500 group',
                {
                    'text-gray-400 bg-gray-300': disabled,
                },
            )}
            onClick={onClick}
        >
            <span className="text-4xl font-bold">{icon}</span>
            <span
                className={cn('text-blue-500', {
                    'text-gray-400': disabled,
                })}
            >
                {label}
            </span>
        </button>
    );
}
