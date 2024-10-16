import { connect } from 'react-redux';
import {
    AxesArray,
    defaultDROPosition,
    DROPosition,
    zeroAllAxes,
    goXYAxes,
} from 'app/features/DRO/utils/DRO';
import { AxisRow } from 'app/features/DRO/component/AxisRow.tsx';
import { IconButton } from 'app/components/IconButton';
import { VscTarget } from 'react-icons/vsc';
import { Button } from 'app/components/Button';

//import { LuParkingSquare } from 'react-icons/lu';
import { Label } from 'app/components/Label';
import get from 'lodash/get';
import { GoTo } from 'app/features/DRO/component/GoTo.tsx';
import store from 'app/store';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    METRIC_UNITS,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import { mapValues } from 'lodash';
import { mapPositionToUnits } from 'app/lib/units.ts';
import { useCallback } from 'react';
import includes from 'lodash/includes';

interface DROProps {
    axes: AxesArray;
    mposController: DROPosition;
    wposController: DROPosition;
    unitLabel: string;
    homingEnabled: boolean;
    canClick: boolean;
    workflowState: string;
    isConnected: boolean;
    activeState: string;
    preferredUnits: 'in' | 'mm';
}

function DRO({
    axes,
    mposController,
    wposController,
    workflowState,
    unitLabel,
    isConnected,
    activeState,
    preferredUnits,
}: DROProps): JSX.Element {
    const canClick = useCallback((): boolean => {
        if (!isConnected) return false;
        if (workflowState === WORKFLOW_STATE_RUNNING) return false;

        const states = [GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_JOG];

        return includes(states, activeState);
    }, [isConnected, workflowState, activeState])();

    const wpos = mapValues(wposController, (pos) => {
        return String(mapPositionToUnits(pos, preferredUnits));
    });

    const mpos = mapValues(mposController, (pos) => {
        return String(mapPositionToUnits(pos, preferredUnits));
    });

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
                <AxisRow
                    axis={'X'}
                    key={'X'}
                    mpos={Number(mpos.x)}
                    wpos={Number(wpos.x)}
                    disabled={!canClick}
                />
                <AxisRow
                    axis={'Y'}
                    key={'Y'}
                    mpos={Number(mpos.y)}
                    wpos={Number(wpos.y)}
                    disabled={!canClick}
                />
                <AxisRow
                    axis={'Z'}
                    key={'Z'}
                    mpos={Number(mpos.z)}
                    wpos={Number(wpos.z)}
                    disabled={!canClick}
                />
                {axes.includes('a') && (
                    <AxisRow
                        axis={'A'}
                        key={'a'}
                        mpos={Number(mpos.a)}
                        wpos={Number(wpos.a)}
                        disabled={!canClick}
                    />
                )}
            </div>
            <div className="flex flex-row justify-between w-full mt-2">
                <IconButton
                    icon={<VscTarget />}
                    onClick={zeroAllAxes}
                    disabled={!canClick}
                >
                    Zero
                </IconButton>
                <Button color="alt" onClick={goXYAxes} disabled={!canClick}>
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

    const workflowState = get(reduxStore, 'controller.workflow.state', 'idle');
    const activeState = get(
        store,
        'controller.state.status.activeState',
        'Idle',
    );
    const isConnected = get(reduxStore, 'connection.isConnected', false);

    return {
        isConnected,
        homingEnabled,
        axes,
        wposController,
        mposController,
        unitLabel,
        workflowState,
        activeState,
        preferredUnits,
    };
})(DRO);
