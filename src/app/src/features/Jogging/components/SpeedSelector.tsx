import cn from 'classnames';

export interface SpeedSelectButtonProps {
    children: JSX.Element;
    active?: boolean;
    onClick?: () => void;
}

export function SpeedSelectButton({
    children,
    active,
    onClick,
}: SpeedSelectButtonProps) {
    return (
        <button
            className={cn('text-sm px-2 py-1 rounded', {
                'bg-blue-400 bg-opacity-30': active,
            })}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export function SpeedSelector() {
    return (
        <div className="flex flex-col bg-white rounded-md border-solid border-[1px] border-gray-300 p-[2px]`">
            <SpeedSelectButton>Rapid</SpeedSelectButton>
            <SpeedSelectButton active>Normal</SpeedSelectButton>
            <SpeedSelectButton>Precise</SpeedSelectButton>
        </div>
    );
}
