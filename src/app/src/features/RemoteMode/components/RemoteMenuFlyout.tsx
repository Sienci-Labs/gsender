import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';
import { useAppTranslation } from 'app/i18n';
import cx from 'classnames';
import { useState } from 'react';
import { Link } from 'react-router';

export function NavFlyoutLink({
    href,
    label,
}: {
    href: string;
    label: string;
}) {
    return (
        <Link
            to={href}
            className="bg-gray-200 p-4 rounded-lg flex flex-row border border-gray-400"
        >
            {label}
        </Link>
    );
}

export function RemoteMenuFlyout() {
    const [open, setOpen] = useState(false);
    const { t } = useAppTranslation();
    const genericHamburgerLine = `h-1 w-6 my-1 rounded-full bg-gray-800 transition ease transform duration-300`;

    return (
        <div className="sm:hidden flex">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        className="flex flex-col h-full w-12 border-2 border-gray-400 rounded justify-center items-center group"
                        type="button"
                        aria-label={t('tools:remoteMode.nav.menu')}
                        aria-expanded={open}
                    >
                        <div
                            className={cx(
                                genericHamburgerLine,
                                open
                                    ? 'rotate-45 translate-y-3 opacity-50 group-hover:opacity-100'
                                    : 'opacity-50 group-hover:opacity-100',
                            )}
                        />
                        <div
                            className={cx(
                                genericHamburgerLine,
                                open
                                    ? 'opacity-0'
                                    : 'opacity-50 group-hover:opacity-100',
                            )}
                        />
                        <div
                            className={cx(
                                genericHamburgerLine,
                                open
                                    ? '-rotate-45 -translate-y-3 opacity-50 group-hover:opacity-100'
                                    : 'opacity-50 group-hover:opacity-100',
                            )}
                        />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-80 p-2 flex flex-col gap-2"
                    align="start"
                    side="bottom"
                    sideOffset={8}
                >
                    <p className="text-gray-800 text-md font-medium">
                        {t('tools:remoteMode.nav.menu')}
                    </p>
                    <NavFlyoutLink
                        href="/remote"
                        label={t('tools:remoteMode.nav.home')}
                    />
                    <NavFlyoutLink
                        href="/remote/config"
                        label={t('common:nav.config')}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
