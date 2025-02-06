import { FaTasks } from 'react-icons/fa';
import { RiToolsFill } from 'react-icons/ri';
import Carve from './assets/Carve.svg';
import { MdChatBubbleOutline } from 'react-icons/md';
import cx from 'classnames';

import { NavbarLink } from './components/NavbarLink.tsx';

interface Props {
    show: boolean;
}

export const NavBar: React.FC<Props> = ({ show = false }) => {
    return (
        <>
            <div
                className={cx(
                    'grid [grid-template-rows:minmax(0,5fr)_auto_auto] no-padding no-margin gap-0 justify-end flex-grow self-stretch',
                )}
            >
                <div className="py-5 border-gray-400 border-r-2"></div>
                <NavbarLink
                    href="/"
                    svg={Carve}
                    label="Carve"
                    minimized={!show}
                />
                <NavbarLink
                    href="/tools"
                    icon={RiToolsFill}
                    label="Tools"
                    minimized={!show}
                />
                <NavbarLink
                    href="/stats"
                    icon={MdChatBubbleOutline}
                    label="Stats/Info"
                    minimized={!show}
                />
                <NavbarLink
                    href="/configuration"
                    icon={FaTasks}
                    label="Config"
                    minimized={!show}
                />
            </div>
        </>
    );
};
