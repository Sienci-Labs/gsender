import { useLocation } from 'react-router';
import cx from 'classnames';

import Visualizer from 'app/features/Visualizer';

import { Column } from '../Column';
import { ToolArea } from '../ToolArea';

export const Carve = () => {
    const { pathname } = useLocation();

    const shouldHide = pathname !== '/';

    return (
        <div className={cx({ hidden: shouldHide }, 'h-full')}>
            <div className="flex h-[75%] max-h-[75%] pb-10 portrait:h-[45%] portrait:max-h-[45%] portrait:pb-0 portrait:block">
                <div className="flex-grow portrait:h-full">
                    <Visualizer />
                </div>

                <div className="flex-shrink-0 w-[33%] max-w-md overflow-hidden flex flex-col h-full portrait:hidden">
                    <Column />
                </div>
            </div>

            <div className="flex h-[25%] max-h-[25%] min-h-48 portrait:h-[55%] portrait:min-h-0 portrait:max-h-[55%]">
                <div className="w-full portrait:w-2/3">
                    <ToolArea />
                </div>
                <div className="hidden portrait:block portrait:w-1/3 portrait:min-w-[400px]">
                    <Column />
                </div>
            </div>
        </div>
    );
};
