import { NavLink } from 'react-router';
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

interface StatMenuProps {
    label: string;
    href: string;
    end?: boolean;
}

function StatMenuLink({ label, href, end = false }: StatMenuProps) {
    return (
        <li className="me-2">
            <NavLink to={href} end={end}>
                {({ isActive }: { isActive: boolean }) => (
                    <span className={linkStyle({ isActive })}>{label}</span>
                )}
            </NavLink>
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
