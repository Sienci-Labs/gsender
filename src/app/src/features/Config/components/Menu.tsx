import cn from 'classnames';
import { MouseEventHandler } from 'react';
import { SettingsMenuSection } from '../assets/SettingsMenu';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import React from 'react';

interface MenuProps {
    menu: SettingsMenuSection[];
    onClick?: (
        e: React.MouseEventHandler<HTMLButtonElement>,
        n: number,
    ) => void;
    activeSection: string;
}

interface MenuItemProps {
    key: string;
    label: string;
    active?: boolean;
    onClick?: (e: MouseEventHandler<HTMLButtonElement>, n: number) => void;
    icon: (p) => JSX.Element;
    available: number;
}

export function tallySettings(settings: SettingsMenuSection) {
    return settings.settings.reduce((a, b) => a + b.settings.length, 0);
}

function MenuItem({
    key,
    label,
    active,
    onClick,
    icon,
    available,
}: MenuItemProps) {
    return (
        <button
            className={cn(
                'flex min-h-8 max-h-14 items-center justify-start gap-2 px-4 max-xl:px-1 max-xl:font-sm max-xl:gap-1 flex-1 border-l-2 border-transparent hover:border-l-blue-500 hover:text-blue-500 hover:fill-blue-500 border-b-border-b-2 border-b-gray-50 font-sans group group-hover:text-blue-500',
                {
                    'text-blue-500 font-italic bg-blue-200 bg-opacity-30 border-l-blue-400':
                        active,
                },
                {
                    hidden: available === 0,
                },
            )}
            key={key}
            onClick={onClick}
        >
            <span
                className={cn(
                    'text-gray-600 text-2xl max-xl:text-xl group-hover:text-blue-500',
                    {
                        'text-blue-500 fill-blue-500': active,
                    },
                )}
            >
                {icon({
                    className: active
                        ? 'text-blue-500'
                        : 'text-gray-600 group-hover:text-blue-500 hover:text-blue-500 dark:text-white',
                })}
            </span>
            <span>{label}</span>
        </button>
    );
}

export function Menu({ menu, onClick, activeSection }: MenuProps) {
    const { settingsFilter } = useSettings();

    const originalMenuLength = menu.length;

    const filteredSettings = menu.map((section) => {
        const newSection = { ...section };
        newSection.settings = section.settings.map((ss) => {
            const fs = { ...ss };
            fs.settings = fs.settings.filter((o) => settingsFilter(o));
            return fs;
        });
        return newSection;
    });

    return (
        //
        <div
            className="flex flex-col w-1/5 border border-gray-200 border-l-0 pl-1 divide-y bg-white dark:bg-dark dark:border-gray-700 dark:text-white"
            style={
                {
                    '--menu-col-length': originalMenuLength,
                } as React.CSSProperties
            }
        >
            {filteredSettings.map((item, index) => {
                const availableSettings = tallySettings(item);
                let active = `h-section-${index}` === activeSection;
                return (
                    <MenuItem
                        key={`menu-item-${index}`}
                        available={availableSettings}
                        label={item.label}
                        active={active}
                        icon={item.icon}
                        onClick={(
                            e: MouseEventHandler<HTMLButtonElement>,
                            i: number,
                        ) => onClick(e, index)}
                    />
                );
            })}
        </div>
    );
}
