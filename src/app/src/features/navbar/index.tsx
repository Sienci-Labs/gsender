import { FaMicrochip } from 'react-icons/fa';
import { FaTasks } from 'react-icons/fa';
import { MdKeyboardCommandKey } from 'react-icons/md';
import { RiToolsFill } from 'react-icons/ri';
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
                    'flex flex-col no-padding no-margin gap-5 justify-end flex-grow self-stretch',
                )}
            >
                <NavbarLink
                    href="/"
                    icon={MdKeyboardCommandKey}
                    label="Control"
                    minimized={!show}
                />
                <NavbarLink
                    href="/tools"
                    icon={RiToolsFill}
                    label="Tools"
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
