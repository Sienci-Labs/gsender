import { GoArrowUpRight } from 'react-icons/go';
import { Link } from 'react-router';

import { Button } from '@gsender/ui/primitives/Button';

interface StatLinkProps {
    link: string;
    label: string;
}

export function StatLink({ link, label }: StatLinkProps) {
    return (
        <Link to={link}>
            <Button text={label} icon={<GoArrowUpRight />} size="sm" />
        </Link>
    );
}
