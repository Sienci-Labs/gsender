import { NavbarLink } from './components/NavbarLink.tsx';
import { FaMicrochip } from 'react-icons/fa';
import { FaCog } from 'react-icons/fa';
import { MdKeyboardCommandKey } from 'react-icons/md';
import cx from 'classnames';

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
                    icon={FaMicrochip}
                    label="Firmware"
                    minimized={!show}
                />
                <NavbarLink
                    href="/configuration"
                    icon={FaCog}
                    label="Preferences"
                    minimized={!show}
                />
            </div>
        </>
    );
};
