export interface ActionButtonProps {
    onClick?: () => void;
    icon: JSX.Element;
    label: string;
    disabled?: boolean;
}

export function ActionButton({
    icon,
    onClick,
    label,
}: ActionButtonProps): JSX.Element {
    return (
        <button
            onClick={onClick}
            className="inline-flex flex-col items-center justify-center px-5 group group-hover:text-blue-500 border-gray-200 border-x hover:bg-gray-50"
        >
            <span className="group-hover:text-blue-500">{icon}</span>
            <span className="text-sm text-gray-500 group-hover:text-blue-500">
                {label}
            </span>
        </button>
    );
}
