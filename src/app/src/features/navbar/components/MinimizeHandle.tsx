import { IoReorderThreeOutline } from 'react-icons/io5';

interface MinimizeHandleProps {
    onClick?: () => void;
}

export function MinimizeHandle(props: MinimizeHandleProps): JSX.Element {
    return (
        <div className="w-full flex justify-center align-middle mt-5 mb-5">
            <IoReorderThreeOutline
                className="text-4xl hover:cursor-pointer"
                onClick={props.onClick}
            />
        </div>
    );
}
