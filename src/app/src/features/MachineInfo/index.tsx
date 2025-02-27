import { useState } from 'react';
import cx from 'classnames';

import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { MachineInfoDisplay } from 'app/features/MachineInfo/MachineInfoDisplay.tsx';

import triangle from './assets/triangle.svg';
import icon from './assets/icon.svg';

const MachineInfo = () => {
    const { isConnected } = useTypedSelector((state) => ({
        isConnected: state.connection.isConnected,
    }));
    const [open, setOpen] = useState(false);
    const [pinned] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        if (pinned) return;
        setOpen(isOpen);
    };

    return (
        <div
            onMouseEnter={() => handleOpenChange(true)}
            onMouseLeave={() => handleOpenChange(false)}
            className="z-50 w-[30px]"
        >
            <div
                className={cx('flex flex-col max-sm:hidden', {
                    'mt-[30px]': open,
                })}
            >
                <img src={icon} className="w-[30px]" />
                <img
                    src={triangle}
                    className={cx('z-10', {
                        hidden: !open,
                        'text-gray-400': !isConnected,
                    })}
                ></img>
            </div>
            <MachineInfoDisplay
                open={open}
                pinned={pinned}
                onClose={() => handleOpenChange(false)}
            />
        </div>
    );
};

export default MachineInfo;
