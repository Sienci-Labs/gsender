import cx from 'classnames';
import { Button } from "app/components/shadcn/Button";
import { TbVector } from 'react-icons/tb';

interface OutlineButtonProps {
    disabled: boolean
}

const OutlineButton: React.FC<OutlineButtonProps> = ({ disabled }) => {

    // TODO
    const runOutline = () => {
        console.log('outline');
    };

    return (
        <Button
            disabled={disabled}
            className={cx(
                "rounded-[0.2rem] border-solid border-2 text-base px-3",
                {
                    "border-blue-400 bg-white [box-shadow:_2px_2px_5px_0px_var(--tw-shadow-color)] shadow-gray-400": !disabled,
                    "border-gray-500 bg-gray-400": disabled
                }
            )}
            onClick={runOutline}
        >
            <TbVector className="text-2xl mr-1" /> Outline
        </Button>
    );
}

export default OutlineButton;