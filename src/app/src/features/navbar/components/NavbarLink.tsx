import { NavLink } from 'react-router';
import cn from 'classnames';
import { IconType } from 'react-icons';

interface NavbarLinkProps {
    href: string;
    icon?: IconType;
    svg?: string;
    label: string;
    minimized?: boolean;
}

export function NavbarLink(props: NavbarLinkProps) {
    return (
        <NavLink to={props.href}>
            {({ isActive }: { isActive: boolean }) => (
                <div
                    className={cn(
                        'flex flex-col gap-0.5 content-center items-center text-sm group ml-1 py-4 opacity-100 border-gray-400 dark:border-gray-700',
                        {
                            'border-r-white border-2 border-r-0 [border-radius:5px_0_0_5px] bg-opacity-30 bg-blue-200 dark:bg-blue-900 [background:linear-gradient(90deg,rgba(121,170,216,0.3)_40%,rgba(255,255,255,1)_100%)] dark:[background:linear-gradient(90deg,rgba(59,130,246,0.2)_40%,rgba(30,41,59,1)_100%)] text-blue-600 dark:text-blue-400 dark:border-gray-700':
                                isActive,
                            'text-gray-500 border-r-2 dark:text-gray-400':
                                !isActive,
                            'border-transparent bg-transparent bg-opacity-100':
                                props.minimized,
                        },
                    )}
                >
                    {props.icon && (
                        <props.icon
                            className={`text-2xl ${isActive ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
                        />
                    )}
                    {props.svg && <img src={props.svg} className="w-16 h-16" />}
                    <span
                        className={cn('text-xs xl:text-sm', {
                            'opacity-0': props.minimized,
                        })}
                    >
                        {props.label}
                    </span>
                </div>
            )}
        </NavLink>
    );
}
