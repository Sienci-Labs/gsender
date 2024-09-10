export interface LabelProps {
    children?: React.ReactNode;
}

export function Label(props: LabelProps) {
    return (
        <span className="text-sm text-gray-400">
            {props.children}
        </span>
    )
}
