import { FaExternalLinkAlt } from 'react-icons/fa';
import { Link } from '@tanstack/react-router';

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
        <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="drop-shadow-md hover:scale-105 rounded border-top border-2 border-t-blue-500 p-3 border-rounded-t flex flex-row items-center justify-between gap-4 flex-grow"
        >
            <div className={'flex flex-row gap-2 flex-shrink-0'}>
                <span className="text-4xl p-2 text-white bg-opacity-50 rounded bg-gradient-to-b from-blue-500 to-robin-300 fill-blue-500">
                    {icon}
                </span>
                <div className={'flex flex-col text-left'}>
                    <h2 className="font-bold">{title}</h2>
                    <span className="text-sm text-gray-500">{children}</span>
                </div>
            </div>
            <div className="fill-blue-500 text-blue-500 flex align-end items-center flex-grow-1">
                <FaExternalLinkAlt />
            </div>
        </a>
    );
}
