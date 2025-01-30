interface ExternalLinkProps {
    title: string;
    children?: React.ReactNode;
    link: string;
    icon?: React.ReactNode;
}

export function ExternalLink({
    title,
    children,
    link,
    icon,
}: ExternalLinkProps): JSX.Element {
    return (
        <button className="drop-shadow-md hover:scale-105 rounded border-top border-2 border-t-blue-500 p-4 border-rounded-t flex flex-row items-center justify-start gap-4">
            <span className="text-5xl from-blue-500 to-blue-200 fill-blue-500">
                {icon}
            </span>
            <div className={'flex flex-col text-left'}>
                <h2 className="font-bold">{title}</h2>
                <span className="text-sm text-gray-500">{children}</span>
            </div>
        </button>
    );
}
