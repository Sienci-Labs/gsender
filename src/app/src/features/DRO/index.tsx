import { connect } from 'react-redux';
import {
    AxesArray,
    defaultDROPosition,
    DROPosition,
    gotoZero,
    zeroAllAxes,
    zeroWCS,
    zeroXYAxes,
} from 'app/features/DRO/utils/DRO';
import { AxisRow } from 'app/features/DRO/component/AxisRow.tsx';
import { IconButton } from 'app/components/IconButton';
import { VscTarget } from 'react-icons/vsc';
import { Button } from 'app/components/Button';

//import { LuParkingSquare } from 'react-icons/lu';
import { Axis } from './utils/DRO';
import { Label } from 'app/components/Label';
import get from 'lodash/get';
import { GoTo } from 'app/features/DRO/component/GoTo.tsx';
import store from 'app/store';
import { METRIC_UNITS } from 'app/constants';
import { mapValues } from 'lodash';
import { mapPositionToUnits } from 'app/lib/units.ts';

interface DROProps {
    axes: AxesArray;
    mpos: DROPosition;
    wpos: DROPosition;
    unitLabel: string;
    homingEnabled: boolean;
    canClick: boolean;
}

function DRO({
    axes,
    mpos,
    wpos,
    homingEnabled,
    unitLabel,
    canClick,
}: DROProps): JSX.Element {
    return (
        <div>
            <div className="w-full min-h-10 flex flex-row align-bottom justify-between mb-2 px-4">
                <GoTo wpos={wpos} units={unitLabel} disabled={!canClick} />
                {/*homingEnabled && (
                    <IconButton icon={<LuParkingSquare />} color="primary" />
                    // Leaving this commented out for the time being since parking is not implemented as a feature yet
                )*/}
            </div>
            <div className="w-full flex flex-row justify-between px-3">
                <Label>Set</Label>
                <Label>Go</Label>
            </div>
            <div className="flex flex-col w-full gap-1 space-between">
                {axes.map((axis: Axis) => (
                    <AxisRow
                        axis={axis}
                        key={axis}
                        mpos={mpos[axis.toLowerCase()]}
                        wpos={wpos[axis.toLowerCase()]}
                        disabled={!canClick}
                    />
                ))}
            </div>
            <div className="flex flex-row justify-between w-full mt-2">
                <IconButton
                    icon={<VscTarget />}
                    onClick={zeroAllAxes}
                    disabled={!canClick}
                >
                    Zero
                </IconButton>
                <Button color="alt" onClick={zeroXYAxes} disabled={!canClick}>
                    <span className="font-mono text-lg">XY</span>
                </Button>
            </div>
        </div>
    );
}

export default connect((reduxStore) => {
    const mposController = get(
        reduxStore,
        'controller.mpos',
        defaultDROPosition,
    );
    const wposController = get(
        reduxStore,
        'controller.wpos',
        defaultDROPosition,
    );
    const axes = get(reduxStore, 'controller.state.axes.axes', ['X', 'Y', 'Z']);
    const settings = get(reduxStore, 'controller.settings.settings', {});
    const homingValue = Number(get(settings, '$22', 0));
    const homingEnabled = homingValue > 0;

    const preferredUnits = store.get('workspace.units', METRIC_UNITS);
    const unitLabel = preferredUnits === METRIC_UNITS ? 'mm' : 'in';

    const wpos = mapValues(wposController, (pos) => {
        return String(mapPositionToUnits(pos, preferredUnits));
    });

    const mpos = mapValues(mposController, (pos) => {
        return String(mapPositionToUnits(pos, preferredUnits));
    });

    const canClick = true;

    return {
        homingEnabled,
        axes,
        wpos,
        mpos,
        unitLabel,
        canClick,
    };
})(DRO);
