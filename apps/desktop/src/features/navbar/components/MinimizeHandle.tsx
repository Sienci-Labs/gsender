import { IoReorderThreeOutline } from 'react-icons/io5';
import cx from 'classnames';

interface MinimizeHandleProps {
    onClick?: () => void;
    className: string;
}

export function MinimizeHandle(props: MinimizeHandleProps): JSX.Element {
    return (
        <div className="w-full flex justify-center align-middle mt-5 mb-5">
            <IoReorderThreeOutline
                className={cx('text-4xl hover:cursor-pointer', props.className)}
                onClick={props.onClick}
            />
        </div>
    );
}
