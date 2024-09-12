import DRO from 'app/features/DRO';
import { Jogging } from 'app/features/Jogging';

export function Location() {
    return (
        <div className="flex flex-col flex-grow justify-between">
            <DRO />
            <Jogging />
        </div>
    );
}
