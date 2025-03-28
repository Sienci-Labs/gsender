import cx from 'classnames';

import { NavBar } from 'app/features/navbar';
import { HelperToggle } from 'app/features/Helper/components/HelperToggle.tsx';

export const Sidebar = () => {
    return (
        <div
            className={cx(
                'flex flex-col justify-around box-border transition-width ease-out duration-1000 w-10 visible max-sm:hidden',
            )}
        >
            <div className="border-r-2 border-gray-400 dark:border-gray-700 flex flex-col no-padding no-margin justify-end flex-grow self-stretch">
                <HelperToggle minimized={false} />
            </div>
            <NavBar />
        </div>
    );
};
