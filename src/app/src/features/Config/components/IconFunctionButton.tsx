export interface IconFunctionButtonProps {
    onClick?: () => void;
    icon: JSX.Element;
    label: string;
}

export function IconFunctionButton({
    onClick,
    icon,
    label,
}: IconFunctionButtonProps): JSX.Element {
    return (
        <button
            className="flex flex-col gap-2 items-center justify-center"
            onClick={onClick}
        >
            <span className="text-4xl text-black font-bold">{icon}</span>
            <span className="text-gray-500">{label}</span>
        </button>
    );
}
