import { FaTasks } from 'react-icons/fa';
import { RiToolsFill } from 'react-icons/ri';
import { IoSpeedometerOutline } from 'react-icons/io5';
import cx from 'classnames';

import Carve from './assets/Carve.svg';
import { NavbarLink } from './components/NavbarLink.tsx';
import { useLocation, useNavigate } from 'react-router';
import { useSettings } from '../Config/utils/SettingsContext.tsx';
import Blocker from './components/Blocker.tsx';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';

export const NavBar = () => {
    const { settingsAreDirty } = useSettings();
    const location = useLocation();
    const navigate = useNavigate();
    const blocker = new Blocker();

    const proceed = () => {
        blocker.proceed();
    };

    const reset = () => {
        blocker.reset();
    };

    const checkIfNeedsBlock = (
        e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
        href: string,
    ) => {
        e.preventDefault();
        if (location.pathname.includes('configuration') && settingsAreDirty) {
            blocker.block(() => navigate(href));
            Confirm({
                title: 'Unsaved Changes',
                content: 'Are you sure you want to leave without saving?',
                onClose: reset,
                onConfirm: proceed,
                confirmLabel: 'Yes',
                cancelLabel: 'No',
            });
        } else {
            navigate(href);
        }
    };
    return (
        <>
            <div
                className={cx(
                    'grid [grid-template-rows:minmax(0,30%)_auto_auto] gap-0 justify-end flex-grow self-stretch',
                )}
            >
                <div className="py-5 border-gray-400 border-r-2 dark:border-gray-700"></div>
                <NavbarLink
                    href="/"
                    svg={Carve}
                    label="Carve"
                    onClick={(e) => checkIfNeedsBlock(e, '/')}
                />
                <NavbarLink
                    href="stats"
                    icon={IoSpeedometerOutline}
                    label="Stats"
                    onClick={(e) => checkIfNeedsBlock(e, 'stats')}
                />
                <NavbarLink
                    href="tools"
                    icon={RiToolsFill}
                    label="Tools"
                    onClick={(e) => checkIfNeedsBlock(e, 'tools')}
                />

                <NavbarLink
                    href="configuration"
                    icon={FaTasks}
                    label="Config"
                />
            </div>
        </>
    );
};
