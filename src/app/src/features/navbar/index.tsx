import { NavbarLink } from './components/NavbarLink.tsx';
import { FaMicrochip } from 'react-icons/fa';
import { FaCog } from 'react-icons/fa';
import { MdKeyboardCommandKey } from 'react-icons/md';
import { MinimizeHandle } from './components/MinimizeHandle.tsx';

export function NavBar() {
    return (
        <div className="w-20 flex flex-col no-padding no-margin gap-5 justify-end flex-grow self-stretch">
            <NavbarLink href="/" icon={MdKeyboardCommandKey} label="Control" />
            <NavbarLink href="/tools" icon={FaMicrochip} label="Firmware" />
            <NavbarLink
                href="/configuration"
                icon={FaCog}
                label="Preferences"
            />
            <MinimizeHandle />
        </div>
    );
}
