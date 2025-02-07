import { NavBar } from 'app/features/navbar';
import { MinimizeHandle } from 'app/features/navbar/components/MinimizeHandle';
import { useState } from 'react';
import cx from 'classnames';

import { HelperToggle } from 'app/features/Helper/components/HelperToggle.tsx';

export const Sidebar = () => {
    const [show, setShow] = useState(true);
    return (
        <div
            className={cx(
                'flex flex-col justify-around box-border transition-width ease-out duration-1000 w-10 ',
                { 'w-20': show },
            )}
        >
            <div className="border-r-2 border-gray-400 flex flex-col no-padding no-margin justify-end flex-grow self-stretch">
                <HelperToggle minimized={!show} />
            </div>
            <NavBar show={show} />
        </div>
    );
};
