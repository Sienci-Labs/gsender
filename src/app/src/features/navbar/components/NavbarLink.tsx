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
                        'flex flex-col gap-0.5 content-center items-center text-sm group ml-0.5 py-5 opacity-100 border-gray-400',
                        {
                            'border-r-white border-2 border-r-0 [border-radius:5px_0_0_5px] bg-opacity-30 bg-blue-200 [background:linear-gradient(90deg,rgba(121,170,216,0.3)_40%,rgba(255,255,255,1)_100%)] text-blue-600':
                                isActive,
                            'text-gray-500 border-r-2': !isActive,
                            'border-transparent bg-transparent bg-opacity-100':
                                props.minimized,
                        },
                    )}
                >
                    {props.icon && (
                        <props.icon
                            className={`text-4xl ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
                        />
                    )}
                    {props.svg && <img src={props.svg} />}
                    <span className={cn('', { 'opacity-0': props.minimized })}>
                        {props.label}
                    </span>
                </div>
            )}
        </NavLink>
    );
}
