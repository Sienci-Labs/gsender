import { DRO } from "features/DRO";
import { Jogging } from "features/Jogging";

export function Location() {
    return (
        <div className="flex flex-col flex-grow">
            <DRO />
            <Jogging />
        </div>
    )
}
