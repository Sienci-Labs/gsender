import { Link } from '@tanstack/react-router';
import { tv } from 'tailwind-variants';

const linkStyle = tv({
    base: 'inline-block px-2 py-2 text-white bg-gray-600 rounded-lg active bg-white',
    variants: {
        isActive: {
            true: 'bg-blue-500 bg-opacity-30 text-blue-500',
            false: 'text-gray-600',
        },
    },
});

function StatMenuLink({
    label,
    href,
    end = false,
}: {
    label: string;
    href: string;
    end?: boolean;
}) {
    return (
        <li className="me-2">
            <Link to={href} end={end} activeOptions={{ exact: true }}>
                {({ isActive }: { isActive: boolean }) => (
                    <span className={linkStyle({ isActive })}>{label}</span>
                )}
            </Link>
        </li>
    );
}

export function StatMenu() {
    return (
        <div className="w-fit mx-auto">
            <ul className="flex text-sm font-medium text-center text-gray-500 items-center justify-center border-gray-200 ring-1 ring-gray-200 rounded p-1">
                <StatMenuLink label="Overview" href={'/stats'} end={true} />
                <StatMenuLink label="Jobs" href={'/stats/jobs'} />
                <StatMenuLink label="Maintenance" href={'/stats/maintenance'} />
                <StatMenuLink label="Alarms" href={'/stats/alarms'} />
                <StatMenuLink label="About" href={'/stats/about'} />
            </ul>
        </div>
    );
}
