import React from "react";

interface NavbarLinkProps {
    href: string;
    icon: React.ComponentType<{
        className?: string
    }>;
    label: string;
    isActive?: boolean
}

export function NavbarLink(props: NavbarLinkProps) {
    return (
        <div className="flex flex-col items-center justify-center text-sm text-gray-500">
            <a className="flex flex-col gap-0.5" href={props.href}>
                <props.icon className="text-4xl text-gray-800"/>
                { props.label }
            </a>
        </div>
    )
}
