import {connect} from "react-redux";
import {AxesArray} from "app/features/DRO/utils/DRO.ts";
import {AxisRow} from "app/features/DRO/component/AxisRow.tsx";
import {IconButton} from "app/components/IconButton";
import { VscTarget } from "react-icons/vsc";
import {Button} from "app/components/Button";

interface DROProps {
    axes: AxesArray
}

function DRO({axes}: DROProps): JSX.Element {

    return (
        <>
            <div>Park/GoTo</div>
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


