import React from 'react';
import { Link } from '@tanstack/react-router';
import cn from 'classnames';

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
        <Link to={props.href}>
            {({ isActive }) => (
                <div
                    className={cn(
                        'flex flex-col gap-0.5 content-center items-center text-sm text-gray-500 group rounded-xl p-1 m-2 transition-all duration-1000 opacity-100 border border-transparent',
                        {
                            'border bg-blue-200 bg-opacity-10': isActive,
                            'border-transparent bg-transparent bg-opacity-100':
                                props.minimized,
                        },
                    )}
                >
                    <props.icon
                        className={`text-4xl ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
                    />
                    <span className={cn('', { 'opacity-0': props.minimized })}>
                        {props.label}
                    </span>
                </div>
            )}
        </Link>
    );
}
