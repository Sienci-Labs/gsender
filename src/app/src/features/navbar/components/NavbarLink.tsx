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
        <div
            className={cn(
                'flex flex-col text-gray-500 group rounded-xl p-1 m-2 ',
                {
                    'border bg-blue-200 bg-opacity-10': props.isActive,
                    'border-transparent bg-transparent bg-opacity-100':
                        props.minimized,
                },
            )}
        >
            <Link
                className={cn(
                    'flex flex-col gap-0.5  self-center content-center items-center justify-center text-sm transition-all duration-1000 opacity-100',
                    { 'text-blue-500': props.isActive },
                )}
                to={props.href}
            >
                <props.icon
                    className={`text-4xl ${props.isActive ? 'text-blue-600' : 'text-gray-600'}`}
                />
                <span className={cn('', { 'opacity-0': props.minimized })}>
                    {props.label}
                </span>
            </Link>
        </div>
    );
}
