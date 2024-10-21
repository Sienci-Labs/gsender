import React from 'react';
import { Link } from '@tanstack/react-router';

interface NavbarLinkProps {
    href: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
    label: string;
    isActive?: boolean;
    minimized?: boolean;
}

export function NavbarLink(props: NavbarLinkProps) {
    return (
        <div className="flex flex-col">
            <Link
                className="flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm text-gray-500"
                to={props.href}
            >
                <props.icon className="text-4xl text-gray-800" />
                {!props.minimized && props.label}
            </Link>
        </div>
    );
}
