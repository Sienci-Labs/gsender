import { useLocation } from 'react-router';
import cx from 'classnames';

import Visualizer from 'app/features/Visualizer';

import { Column } from '../Column';
import { ToolArea } from '../ToolArea';

export const Carve = () => {
    const { pathname } = useLocation();

    const shouldHide = pathname !== '/';

    return (
        <div className={cx({ hidden: shouldHide })}>
            <div className="flex h-[75%] max-h-[75%] pb-10">
                <div className="flex-grow">
                    <Visualizer />
                </div>

                <div className="flex-shrink-0 w-[33%] max-w-md overflow-hidden flex flex-col h-full">
                    <Column />
                </div>
            </div>

            <div className="flex h-[25%] max-h-[25%] min-h-48">
                <ToolArea />
            </div>
        </div>
    );
};
