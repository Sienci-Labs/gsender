import { useLocation } from 'react-router';
import cx from 'classnames';
import { useMediaQuery } from 'react-responsive';

import Visualizer from 'app/features/Visualizer';

import { Column } from '../Column';
import { ToolArea } from '../ToolArea';

export const Carve = () => {
    const { pathname } = useLocation();
    const isPortrait = useMediaQuery({ query: '(orientation: portrait)' });

    const shouldHide = pathname !== '/';

    return (
        <div className={cx({ hidden: shouldHide }, 'h-full')}>
            <div
                className={cx(
                    'flex',
                    isPortrait
                        ? 'h-[45%] max-h-[45%] pb-0 block portrait:h-[45%] portrait:max-h-[45%] portrait:pb-0 portrait:block'
                        : 'h-[75%] max-h-[75%] pb-10',
                )}
            >
                <div className={isPortrait ? 'h-full w-full' : 'flex-grow'}>
                    <Visualizer />
                </div>

                {!isPortrait && (
                    <div className="flex-shrink-0 w-[33%] max-w-md overflow-hidden flex flex-col h-full">
                        <Column />
                    </div>
                )}
            </div>

            <div
                className={cx(
                    'flex',
                    isPortrait
                        ? 'h-[55%] min-h-0 max-h-[55%]'
                        : 'h-[25%] max-h-[25%] min-h-48',
                )}
            >
                <div className={isPortrait ? 'w-2/3' : 'w-full'}>
                    <ToolArea />
                </div>

                {isPortrait && (
                    <div className="w-1/3 min-w-[400px]">
                        <Column />
                    </div>
                )}
            </div>
        </div>
    );
};
