import { GoArrowUpRight } from 'react-icons/go';

interface StatLinkProps {
    link: string;
    label: string;
}

export function StatLink({ label }: StatLinkProps) {
    return (
        <button className="border border-gray-500 text-gray-700 px-2 rounded flex flex-row gap-1 items-center">
            {label}
            <GoArrowUpRight />
        </button>
    );
}
