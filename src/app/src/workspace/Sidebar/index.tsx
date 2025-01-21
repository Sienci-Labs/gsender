import { NavBar } from 'app/features/navbar';
import { MinimizeHandle } from 'app/features/navbar/components/MinimizeHandle';
import { useState } from 'react';
import cx from 'classnames';
import { NavbarLink } from 'app/features/navbar/components/NavbarLink.tsx';

import { HelperToggle } from 'app/features/Helper/components/HelperToggle.tsx';

export const Sidebar = () => {
    const [show, setShow] = useState(true);
    return (
        <div
            className={cx(
                'border flex flex-col justify-around box-border transition-width ease-out duration-1000 w-10',
                { 'w-20': show },
            )}
        >
            <div className="flex flex-col no-padding no-margin gap-5 justify-end flex-grow self-stretch">
                <HelperToggle minimized={!show} />
            </div>
            <NavBar show={show} />
            <MinimizeHandle
                className={cx('z-20')}
                onClick={() => setShow(!show)}
            />
        </div>
    );
};
