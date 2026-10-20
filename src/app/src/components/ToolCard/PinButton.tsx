import cx from 'classnames';
import type { MouseEvent } from 'react';
import { TbStar, TbStarFilled } from 'react-icons/tb';

type PinButtonProps = {
    pinned: boolean;
    onToggle: () => void;
    className?: string;
};

const PinButton = ({ pinned, onToggle, className }: PinButtonProps) => {
    const label = pinned ? 'Unpin tool' : 'Pin to top';

    // Cards are wrapped in a Link, so stop the click from navigating
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-pressed={pinned}
            aria-label={label}
            title={label}
            className={cx(
                'p-1 rounded-full',
                'transition-colors duration-200',
                'hover:bg-gray-400/40 dark:hover:bg-white/10',
                pinned
                    ? 'text-amber-400'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-content-primary',
                className,
            )}
        >
            {pinned ? (
                <TbStarFilled className="w-5 h-5" />
            ) : (
                <TbStar className="w-5 h-5" />
            )}
        </button>
    );
};

export default PinButton;
