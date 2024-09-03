import {connect} from "react-redux";
import {AxesArray} from "features/DRO/utils/DRO.ts";
import {AxisRow} from "features/DRO/component/AxisRow.tsx";
import {IconButton} from "components/IconButton";
import { VscTarget } from "react-icons/vsc";
import {Button} from "app/components/Button";
import { FaPaperPlane } from "react-icons/fa6";
import { LuParkingSquare } from "react-icons/lu";

interface DROProps {
    axes: AxesArray
}

function DRO({axes}: DROProps): JSX.Element {

    return (
        <>
            <div className="w-full min-h-10 flex flex-row justify-between mb-2 px-4">
                <IconButton icon={<LuParkingSquare />} color="primary"/>
                <IconButton icon={<FaPaperPlane />} color="primary"/>
            </div>
            <div className="flex flex-col w-full gap-1 space-between">
                {
                    axes.map((axis) => <AxisRow axis={axis} key={axis} />)
                }
            </div>
            <div className="flex flex-row justify-between w-full mt-2">
                <IconButton icon={<VscTarget  />}>Zero</IconButton>
                <Button color="primary"><span className="font-mono text-lg">XY</span></Button>
            </div>
        </>
    )
}

export default connect(() => {
    return {
        axes: ['X', 'Y', 'Z', 'A']
    }
})(DRO);


