import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import cx from 'classnames';
import { NavLink } from 'react-bootstrap';

export function NavFlyoutLink({
    href,
    label,
}: {
    href: string;
    label: string;
}) {
    return (
        <Link href={href} className="bg-gray-100 p-4 rounded flex flex-row">
            {label}
        </Link>
    );
}

export function RemoteMenuFlyout() {
    const [isOpen, setIsOpen] = useState(false);
    const genericHamburgerLine = `h-1 w-6 my-1 rounded-full bg-black transition ease transform duration-300`;

    function openHandler() {
        setIsOpen(!isOpen);
    }

    return (
        <div className="sm:hidden relative flex w-full flex-grow">
            <button
                className="flex flex-col h-12 w-12 border-2 border-black rounded justify-center items-center group"
                type="button"
                onClick={openHandler}
            >
                <div
                    className={`${genericHamburgerLine} ${
                        isOpen
                            ? 'rotate-45 translate-y-3 opacity-50 group-hover:opacity-100'
                            : 'opacity-50 group-hover:opacity-100'
                    }`}
                />
                <div
                    className={`${genericHamburgerLine} ${
                        isOpen
                            ? 'opacity-0'
                            : 'opacity-50 group-hover:opacity-100'
                    }`}
                />
                <div
                    className={`${genericHamburgerLine} ${
                        isOpen
                            ? '-rotate-45 -translate-y-3 opacity-50 group-hover:opacity-100'
                            : 'opacity-50 group-hover:opacity-100'
                    }`}
                />
            </button>

            <div
                className={cx(
                    'absolute top-14 inset-x-0 transition transform-origin-top-right h-screen md:hidden p-2 flex flex-col bg-transparent divide divide-y divide-gray-400',
                    { hidden: !isOpen },
                )}
            >
                <NavFlyoutLink href={''} label={'I'} />
                <NavFlyoutLink href={''} label={"Don't"} />
                <NavFlyoutLink href={''} label={'Know'} />
                <NavFlyoutLink href={''} label={'What'} />
                <NavFlyoutLink href={''} label={'Goes'} />
                <NavFlyoutLink href={''} label={'Here'} />
            </div>
        </div>
    );
}
