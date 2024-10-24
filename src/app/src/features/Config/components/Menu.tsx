import cn from 'classnames';

interface MenuProps {
    menu: string[];
    onClick?: (
        e: React.MouseEventHandler<HTMLButtonElement>,
        n: number,
    ) => void;
    activeSection: number;
}

interface MenuItemProps {
    key: number;
    label: string;
    active?: boolean;
    onClick?: (e: MouseEventHandler<HTMLButtonElement>, n: number) => void;
}

function MenuItem({ key, label, active, onClick }: MenuItemProps) {
    console.log(active);
    return (
        <button
            className={cn(
                'flex items-center justify-center flex-1 border-l-2 border-transparent hover:border-l-blue-500 hover:text-blue-500 border-b-border-b-2 border-b-gray-50',
                {
                    'text-blue-500 font-italic bg-blue-200 bg-opacity-30 border-l-blue-400':
                        active,
                },
            )}
            key={key}
            onClick={onClick}
        >
            {label}
        </button>
    );
}

export function Menu({ menu, onClick, activeSection }: MenuProps) {
    return (
        <div className="flex flex-col w-1/5 items-stretch border border-gray-200 divide-y bg-white">
            {menu.map((item, index) => {
                let active = index === activeSection;
                return (
                    <MenuItem
                        key={index}
                        label={item}
                        active={active}
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
