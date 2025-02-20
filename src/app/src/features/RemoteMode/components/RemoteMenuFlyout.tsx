import { GiHamburgerMenu } from 'react-icons/gi';

export function RemoteMenuFlyout() {
    return (
        <div className="sm:hidden">
            <span className="text-3xl text-gray-600">
                <GiHamburgerMenu />
            </span>
        </div>
    );
}
