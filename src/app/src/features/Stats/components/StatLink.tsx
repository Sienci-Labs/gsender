import { GoArrowUpRight } from 'react-icons/go';
import { Link } from '@tanstack/react-router';

interface StatLinkProps {
    link: string;
    label: string;
}

export function StatLink({ link, label }: StatLinkProps) {
    return (
        <Link
            to={link}
            className="border border-gray-500 text-gray-700 px-2 rounded flex flex-row gap-1 items-center"
        >
            {label}
            <GoArrowUpRight />
        </Link>
    );
}
