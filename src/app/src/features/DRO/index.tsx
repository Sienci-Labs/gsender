import {connect} from "react-redux";
import {AxesArray, defaultDROPosition, DROPosition} from "app/features/DRO/utils/DRO";
import {AxisRow} from "app/features/DRO/component/AxisRow.tsx";
import {IconButton} from "app/components/IconButton";
import { VscTarget } from "react-icons/vsc";
import {Button} from "app/components/Button";

import { LuParkingSquare } from "react-icons/lu";
import { Axis } from "./utils/DRO";
import { Label } from "app/components/Label";
import get from 'lodash/get';
import { GoTo } from "app/features/Connection/components/GoTo";

interface DROProps {
    axes: AxesArray,
    mpos: DROPosition,
    wpos: DROPosition
    homingEnabled: boolean
}

function DRO({ axes, mpos, wpos, homingEnabled}: DROProps): JSX.Element {

    return (
        <>
            <div className="w-full min-h-10 flex flex-row-reverse align-bottom justify-between mb-2 px-4">
                <GoTo />
                {
                    homingEnabled && <IconButton icon={<LuParkingSquare/>} color="primary"/>
                }

            </div>
            <div className="w-full flex flex-row justify-between px-3">
                <Label>Set</Label>
                <Label>Go</Label>
            </div>
            <div className="flex flex-col w-full gap-1 space-between">
                {
                    axes.map((axis: Axis) => <AxisRow axis={axis} key={axis} mpos={mpos[axis.toLowerCase()]} wpos={wpos[axis.toLowerCase()]}/>)
                }
            </div>
            <div className="flex flex-row justify-between w-full mt-2">
                <IconButton icon={<VscTarget/>}>Zero</IconButton>
                <Button color="primary"><span className="font-mono text-lg">XY</span></Button>
            </div>
        </>
    )
}

export default connect((store) => {
    const mposController = get(store, 'controller.mpos', defaultDROPosition);
    const wposController = get(store, 'controller.wpos', defaultDROPosition);
    const axes = get(store, 'controller.state.axes.axes', ['X', 'Y', 'Z']);
    const settings = get(store, 'controller.settings.settings', {});
    const homingValue = Number(get(settings, '$22', 0));
    const homingEnabled = homingValue > 0;

    console.log(mposController);

    const wpos = wposController;
    const mpos = mposController;

    return {
        homingEnabled,
        axes,
        wpos,
        mpos
    }
})(DRO);


