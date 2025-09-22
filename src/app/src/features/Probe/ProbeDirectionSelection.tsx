import cx from 'classnames';
import directionIcon from './assets/arrow-direction.svg';
import Tooltip from 'app/components/Tooltip';

interface Props {
    direction: number;
    onClick: () => void;
}

const ProbeDirectionSelection: React.FC<Props> = ({ direction, onClick }) => {
    return (
        <Tooltip content="Set probing corner">
            <div className="absolute top-0 right-0">
                <button
                    type="button"
                    className={cx(
                        'border-0 outline-none rounded-xl [box-shadow:20px_20px_60px_#bebebe_-20px_-20px_60px_#ffffff] z-[100] dark:invert dark:hue-rotate-180',
                        {
                            'transition-none [transform:rotate(0deg)]':
                                direction === 0,
                            '[transform:rotate(90deg)]': direction === 1,
                            '[transform:rotate(180deg)]': direction === 2,
                            '[transform:rotate(270deg)]': direction === 3,
                        },
                    )}
                    onClick={onClick}
                >
                    <img
                        className="min-w-7"
                        alt="Probe direction selection"
                        src={directionIcon}
                    />
                </button>
            </div>
        </Tooltip>
    );
};

export default ProbeDirectionSelection;
