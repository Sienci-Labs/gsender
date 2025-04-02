import cn from 'classnames';
import { MouseEventHandler } from 'react';
import { SettingsMenuSection } from '../assets/SettingsMenu';

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
}

function MenuItem({ key, label, active, onClick, icon }: MenuItemProps) {
    return (
        <button
            className={cn(
                'flex items-center justify-start gap-2 px-4 flex-1 border-l-2 border-transparent hover:border-l-blue-500 hover:text-blue-500 hover:fill-blue-500 border-b-border-b-2 border-b-gray-50 font-sans group group-hover:text-blue-500',
                {
                    'text-blue-500 font-italic bg-blue-200 bg-opacity-30 border-l-blue-400':
                        active,
                },
            )}
            key={key}
            onClick={onClick}
        >
            <span
                className={cn(
                    'text-gray-600 text-2xl group-hover:text-blue-500',
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
    return (
        <div className="flex flex-col w-1/5 items-stretch border border-gray-200 border-l-0 pl-1 divide-y bg-white dark:bg-dark dark:border-gray-700 dark:text-white">
            {menu.map((item, index) => {
                let active = `section-${index}` === activeSection;
                return (
                    <MenuItem
                        key={`menu-item-${index}`}
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
