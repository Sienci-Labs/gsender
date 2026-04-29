import { Link } from 'react-router';
import { FaHatWizard } from 'react-icons/fa';

interface ToolLinkProps {
    link: string;
    label: string;
}

export function ToolLink({ link, label }: ToolLinkProps) {
    return (
        <Link
            to={link}
            className="bg-white shadow p-2 rounded border border-blue-500 justify-center flex flex-row gap-2 items-center text-sm text-gray-700 hover:bg-gray-100 dark:bg-dark dark:text-white dark:hover:bg-dark-lighter"
        >
            <FaHatWizard className="text-lg" />
            {label}
        </Link>
    );
}

export function SquaringToolWizard() {
    return <ToolLink link="/tools/squaring" label="Square XY" />;
}
