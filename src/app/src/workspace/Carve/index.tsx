import Visualizer from 'app/features/Visualizer';
import { Column } from '../Column';
import { ToolArea } from '../ToolArea';
import { useLocation } from 'react-router';
import cx from 'classnames';

export const Carve = () => (
    <div
        className={cx('absolute w-[calc(100%-77px)]', {
            hidden: useLocation().pathname !== '/',
        })}
    >
        <div className="flex h-[75%] pb-10">
            <div className="flex-grow">
                <Visualizer />
            </div>

            <div className="flex-shrink-0 w-[33%] max-w-md overflow-hidden flex flex-col h-full">
                <Column />
            </div>
        </div>

        <div className="flex h-[25%] min-h-48">
            <ToolArea />
        </div>
    </div>
);
