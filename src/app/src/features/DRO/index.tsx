import { connect } from 'react-redux';
import {
    AxesArray,
    defaultDROPosition,
    DROPosition,
    zeroAllAxes,
    goXYAxes,
    zeroWCS,
    gotoZero,
} from 'app/features/DRO/utils/DRO';
import { AxisRow } from 'app/features/DRO/component/AxisRow.tsx';
import { IconButton } from 'app/components/IconButton';
import { VscTarget } from 'react-icons/vsc';
import { Button } from 'app/components/Button';
import { LuSquareParking } from 'react-icons/lu';
import { Label } from 'app/components/Label';
import get from 'lodash/get';
import { GoTo } from 'app/features/DRO/component/GoTo.tsx';
import store from 'app/store';
import {
    AXIS_X,
    AXIS_Y,
    AXIS_Z,
    AXIS_A,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    LOCATION_CATEGORY,
    METRIC_UNITS,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import mapValues from 'lodash/mapValues';
import { mapPositionToUnits } from 'app/lib/units.ts';
import { useCallback, useEffect, useState } from 'react';
import includes from 'lodash/includes';
import { HomingSwitch } from 'app/features/DRO/component/HomingSwitch.tsx';
import { RapidPositionButtons } from 'app/features/DRO/component/RapidPositionButtons.tsx';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from 'app/components/shadcn/AlertDialog';
import { UnitBadge } from 'app/features/DRO/component/UnitBadge.tsx';
import { Parking } from 'app/features/DRO/component/Parking.tsx';

import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
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
    singleAxisHoming: boolean;
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
    homingEnabled,
    singleAxisHoming,
}: DROProps) {
    const [homingMode, setHomingMode] = useState<boolean>(false);
    const [isRotaryMode, setIsRotaryMode] = useState<boolean>(false);
    const { shouldWarnZero } = useWorkspaceState();

    useEffect(() => {
        const mode = store.get('workspace.mode', 'DEFAULT') === 'ROTARY';
        setIsRotaryMode(mode);
        store.on('change', () => {
            const workspaceMode = store.get('workspace.mode', 'DEFAULT');
            setIsRotaryMode(workspaceMode === 'ROTARY');
        });
    }, []);

    const shuttleControlEvents = {
        ZERO_X_AXIS: {
            title: 'Zero X Axis',
            keys: ['shift', 'w'].join('+'),
            cmd: 'ZERO_X_AXIS',
            preventDefault: true,
            payload: { axis: AXIS_X },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => zeroWCS('X', 0),
        },
        ZERO_Y_AXIS: {
            title: 'Zero Y Axis',
            keys: ['shift', 'e'].join('+'),
            cmd: 'ZERO_Y_AXIS',
            preventDefault: true,
            payload: { axis: AXIS_Y },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => zeroWCS('Y', 0),
        },
        ZERO_Z_AXIS: {
            title: 'Zero Z Axis',
            keys: ['shift', 'r'].join('+'),
            cmd: 'ZERO_Z_AXIS',
            preventDefault: true,
            payload: { axis: AXIS_Z },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => zeroWCS('Z', 0),
        },
        ZERO_A_AXIS: {
            id: 72,
            title: 'Zero A Axis',
            keys: ['shift', '0'].join('+'),
            cmd: 'ZERO_A_AXIS',
            preventDefault: true,
            payload: { axis: AXIS_A },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => zeroWCS('A', 0),
        },
        ZERO_ALL_AXIS: {
            title: 'Zero All',
            keys: ['shift', 'q'].join('+'),
            cmd: 'ZERO_ALL_AXIS',
            payload: { axis: 'all' },
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => zeroAllAxes(),
        },
        GO_TO_A_AXIS_ZERO: {
            id: 73,
            title: 'Go to A Zero',
            keys: ['shift', '1'].join('+'),
            cmd: 'GO_TO_A_AXIS_ZERO',
            preventDefault: true,
            payload: { axisList: [AXIS_A] },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => gotoZero('A'),
        },
        GO_TO_X_AXIS_ZERO: {
            title: 'Go to X Zero',
            keys: ['shift', 's'].join('+'),
            cmd: 'GO_TO_X_AXIS_ZERO',
            preventDefault: true,
            payload: { axisList: [AXIS_X] },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => gotoZero('X'),
        },
        GO_TO_Y_AXIS_ZERO: {
            title: 'Go to Y Zero',
            keys: ['shift', 'd'].join('+'),
            cmd: 'GO_TO_Y_AXIS_ZERO',
            preventDefault: true,
            payload: { axisList: [AXIS_Y] },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => gotoZero('Y'),
        },
        GO_TO_Z_AXIS_ZERO: {
            title: 'Go to Z Zero',
            keys: ['shift', 'f'].join('+'),
            cmd: 'GO_TO_Z_AXIS_ZERO',
            preventDefault: true,
            payload: { axisList: [AXIS_Z] },
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => gotoZero('Z'),
        },
        GO_TO_XY_AXIS_ZERO: {
            title: 'Go to XY Zero',
            keys: ['shift', 'a'].join('+'),
            cmd: 'GO_TO_XY_AXIS_ZERO',
            payload: { axisList: [AXIS_X, AXIS_Y] },
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => goXYAxes(),
        },
    };

    useShuttleEvents(shuttleControlEvents);
    useKeybinding(shuttleControlEvents);

    function toggleHoming() {
        setHomingMode(!homingMode);
    }

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
        <div className="relative">
            <UnitBadge />
            <div className="w-full min-h-10 flex flex-row-reverse align-bottom justify-center gap-36 relative">
                <GoTo wpos={wpos} units={unitLabel} disabled={!canClick} />
                {homingEnabled && <RapidPositionButtons />}
                {homingEnabled && (
                    <Parking />
                    // Leaving this commented out for the time being since parking is not implemented as a feature yet
                )}
            </div>
            <div className="w-full flex flex-row justify-between px-3">
                <Label>{homingMode ? 'Home' : 'Zero'}</Label>
                <Label>Go</Label>
            </div>
            <div className="flex flex-col w-full gap-1 space-between">
                <AxisRow
                    axis={'X'}
                    key={'X'}
                    mpos={mpos.x}
                    wpos={wpos.x}
                    disabled={!canClick}
                    homingMode={homingMode}
                />
                {!isRotaryMode && (
                    <AxisRow
                        axis={'Y'}
                        key={'Y'}
                        mpos={mpos.y}
                        wpos={wpos.y}
                        disabled={!canClick}
                        homingMode={homingMode}
                    />
                )}
                <AxisRow
                    axis={'Z'}
                    key={'Z'}
                    mpos={mpos.z}
                    wpos={wpos.z}
                    disabled={!canClick}
                    homingMode={homingMode}
                />
                {(isRotaryMode || axes.includes('A')) && (
                    <AxisRow
                        axis={'A'}
                        key={'a'}
                        mpos={mpos.a}
                        wpos={wpos.a}
                        disabled={!canClick}
                        homingMode={homingMode}
                    />
                )}
            </div>
            <div className="flex flex-row justify-between w-full mt-2">
                {!shouldWarnZero ? (
                    <Button
                        text="Zero"
                        icon={<VscTarget className="w-5 h-5" />}
                        onClick={zeroAllAxes}
                        disabled={!canClick}
                        size="sm"
                    />
                ) : (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                text="Zero"
                                icon={<VscTarget className="w-5 h-5" />}
                                disabled={!canClick}
                            />
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Zero All Axes
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to zero all axes?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={zeroAllAxes}>
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                {homingEnabled && (
                    <HomingSwitch
                        onChange={toggleHoming}
                        homingValue={homingMode}
                        disabled={!canClick}
                        singleAxisHoming={singleAxisHoming}
                    />
                )}

                <Button variant="alt" onClick={goXYAxes} disabled={!canClick}>
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
    const singleAxisValue = homingValue & 2;
    const singleAxisHoming = singleAxisValue > 0;

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
        singleAxisHoming,
    };
})(DRO);
