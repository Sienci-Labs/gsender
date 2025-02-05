import React from 'react';
import { StatLink } from 'app/features/Stats/components/StatLink.tsx';

interface CardHeaderProps {
    children?: React.ReactNode;
    link?: string;
    linkLabel?: string;
}

export function CardHeader({ children, link, linkLabel }: CardHeaderProps) {
    return (
        <div className="flex flex-row justify-between items-center">
            <h1 className="text-2xl text-blue-500 pb-2">{children}</h1>
            {link && <StatLink link={link} label={linkLabel} />}
        </div>
    );
}
