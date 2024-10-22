import React from 'react';

interface MenuProps {
    menu: string[];
}

interface MenuItemProps {
    key: number;
    label: string;
}

function MenuItem({ key, label }: MenuItemProps) {
    return (
        <button
            className="flex items-center justify-center border border-gray-200"
            key={key}
        >
            {label}
        </button>
    );
}

export function Menu({ menu }: MenuProps) {
    return (
        <div className="flex flex-col gap-2 w-1/5 items-stretch border-separate">
            {menu.map((item, index) => (
                <MenuItem key={index} label={item} />
            ))}
        </div>
    );
}
