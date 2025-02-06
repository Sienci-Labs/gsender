import { Link } from '@tanstack/react-router';
import { tv } from 'tailwind-variants';

const linkStyle = tv({
    base: 'rounded-md relative px-2 py-0.5 font-bold',
    variants: {
        isActive: {
            true: 'bg-blue-400 bg-opacity-30',
        },
    },
});

function StatMenuLink({ label, href, end = false }) {
    return (
        <Link to={href} end={end} activeOptions={{ exact: true }}>
            {({ isActive }) => (
                <span className={linkStyle({ isActive })}>{label}</span>
            )}
        </Link>
    );
}

export function StatMenu() {
    return (
        <div className="items-center justify-center flex flex-row box-border bg-white rounded-md border-solid border border-gray-300 p-0.5 gap-4">
            <StatMenuLink label="Overview" href={'/stats'} end={true} />
            <StatMenuLink label="Jobs" href={'/stats/jobs'} />
            <StatMenuLink label="Maintenance" href={'/stats/maintenance'} />
            <StatMenuLink label="Alarms" href={'/stats/alarms'} />
        </div>
    );
}
