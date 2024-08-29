import {connect} from "react-redux";
import {AxesArray} from "app/features/DRO/utils/DRO.ts";
import {AxisRow} from "app/features/DRO/component/AxisRow.tsx";

interface DROProps {
    axes: AxesArray
}

function DRO({axes}: DROProps): JSX.Element {

    return (
        <div className="flex flex-col w-full gap-4 space-between">
            {
                axes.map((axis) => <AxisRow axis={axis} key={axis} />)
            }
        </div>
    )
}

export default connect(() => {
    return {
        axes: ['X', 'Y', 'Z', 'A']
    }
})(DRO);


