import { FaTasks } from 'react-icons/fa';
import { RiToolsFill } from 'react-icons/ri';
import { IoSpeedometerOutline } from 'react-icons/io5';
import cx from 'classnames';

import Carve from './assets/Carve.svg';
import { NavbarLink } from './components/NavbarLink.tsx';

export const NavBar = () => {
    return (
        <>
            <div
                className={cx(
                    'grid [grid-template-rows:minmax(0,5fr)_auto_auto] no-padding no-margin gap-0 justify-end flex-grow self-stretch',
                )}
            >
                <div className="py-5 border-gray-400 border-r-2 dark:border-gray-700"></div>
                <NavbarLink href="/" svg={Carve} label="Carve" />
                <NavbarLink
                    href="stats"
                    icon={IoSpeedometerOutline}
                    label="Stats"
                />
                <NavbarLink href="tools" icon={RiToolsFill} label="Tools" />

                <NavbarLink
                    href="configuration"
                    icon={FaTasks}
                    label="Config"
                />
            </div>
        </>
    );
};
