import { StatLink } from 'app/features/Stats/components/StatLink.tsx';
import { Link } from 'react-router';
import { FaHatWizard } from 'react-icons/fa';

export function ToolLink({ link, label }) {
    return (
        <Link
            to={link}
            className="text-lg border border-blue-500 shadow hover:bg-gray-100 text-gray-700 p-2 justify-center rounded flex flex-row gap-2 items-center dark:text-white dark:hover:bg-dark-lighter"
        >
            {label}
            <FaHatWizard />
        </Link>
    );
}

export function SquaringToolWizard() {
    return <ToolLink link="/squaring" label="Square XY" />;
}
