import { NavbarLink } from './components/NavbarLink.tsx';
import { FaMicrochip } from 'react-icons/fa';
import { FaTasks } from 'react-icons/fa';
import { MdKeyboardCommandKey } from 'react-icons/md';
import cx from 'classnames';

interface Props {
    show: boolean;
}
export const NavBar: React.FC<Props> = ({ show }) => {
    return (
        <>
            <div
                className={cx(
                    'w-20 flex flex-col no-padding no-margin gap-5 justify-end flex-grow self-stretch',
                    { hidden: !show },
                )}
            >
                <NavbarLink
                    href="/"
                    icon={MdKeyboardCommandKey}
                    label="Control"
                />
                <NavbarLink href="/tools" icon={FaMicrochip} label="Firmware" />
                <NavbarLink
                    href="/configuration"
                    icon={FaTasks}
                    label="Preferences"
                />
            </div>
        </>
    );
};
