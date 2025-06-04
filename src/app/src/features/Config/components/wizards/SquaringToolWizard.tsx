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
            className="text-sm border border-blue-500 bg-white dark:bg-dark shadow hover:bg-gray-100 text-gray-700 p-2 justify-center rounded flex flex-row gap-2 items-center dark:text-white dark:hover:bg-dark-lighter"
        >
            <FaHatWizard className="text-lg" />
            {label}
        </Link>
    );
}

export function SquaringToolWizard() {
    return <ToolLink link="/tools/squaring" label="Square XY" />;
}
