import Actions from './Actions';
import Toggle from './Toggle';

const RotaryNew = () => {
    return (
        <div className="flex flex-col gap-4 justify-center items-center h-full">
            <Toggle />
            <Actions />
        </div>
    );
};

export default RotaryNew;
