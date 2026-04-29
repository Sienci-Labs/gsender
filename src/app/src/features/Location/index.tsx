import DRO from '@gsender/features/DRO';
import { Jogging } from '@gsender/features/Jogging';

export function Location() {
    return (
        <div className="flex flex-col flex-grow justify-between">
            <DRO />
            <Jogging />
        </div>
    );
}
