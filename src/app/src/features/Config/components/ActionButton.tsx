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
    disabled = false,
}: ActionButtonProps): JSX.Element {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="inline-flex flex-col disabled:bg-gray-200 disabled:text-gray-300 items-center justify-center px-5 group group-hover:text-blue-500 border-gray-200 border-x hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:bg-dark"
        >
            <span className="enabled:group-hover:text-blue-500 text-gray-600 dark:text-white">
                {icon}
            </span>
            <span className="text-sm text-gray-600 enabled:group-hover:text-blue-500 dark:text-white">
                {label}
            </span>
        </button>
    );
}
