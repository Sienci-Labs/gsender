import { NavbarLink } from './components/NavbarLink.tsx';
import { FaTasks } from 'react-icons/fa';
import { HiOutlineChatBubbleOvalLeftEllipsis } from 'react-icons/hi2';
import { FaCog } from 'react-icons/fa';
import { MdKeyboardCommandKey } from 'react-icons/md';
import { MinimizeHandle } from './components/MinimizeHandle.tsx';

export function NavBar() {
    return (
        <div className="w-20 flex flex-col no-padding no-margin gap-5 justify-end flex-grow self-stretch">
            <NavbarLink href="/" icon={MdKeyboardCommandKey} label="Control" />
            <NavbarLink href="/configuration" icon={FaTasks} label="Config" />
            <NavbarLink
                href="/stats"
                icon={HiOutlineChatBubbleOvalLeftEllipsis}
                label="Info"
            />
            <NavbarLink href="/tools" icon={FaCog} label="Preferences" />
            <MinimizeHandle />
        </div>
    );
}
