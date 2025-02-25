import { useState } from 'react';
import icon from './assets/icon.svg';
import triangle from './assets/triangle.svg';
import cx from 'classnames';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import store from 'app/store';
import { MachineInfoDisplay } from 'app/features/MachineInfo/MachineInfoDisplay.tsx';

const MachineInfo = () => {
    const { isConnected } = useTypedSelector((state) => ({
        isConnected: state.connection.isConnected,
    }));
    const probeSelection = store.get('widgets.probe.probeCommand');
    const [open, setOpen] = useState(false);
    const [pinned, setPinned] = useState(false);

    const openCard = (isOpen: boolean) => {
        if (pinned) {
            return;
        }
        setOpen(isOpen);
    };
    return (
        <div
            onMouseEnter={() => openCard(true)}
            onMouseLeave={() => openCard(false)}
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
            <MachineInfoDisplay open={open} pinned={pinned} />
        </div>
    );
};

export default MachineInfo;
