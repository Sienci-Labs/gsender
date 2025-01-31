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
}: DROProps): JSX.Element {
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
        <div>
            <div className="w-full min-h-10 flex flex-row-reverse align-bottom justify-between mb-2 px-4 relative">
                <GoTo wpos={wpos} units={unitLabel} disabled={!canClick} />
                {homingEnabled && <RapidPositionButtons />}
                {/*homingEnabled && (
                    <IconButton icon={<LuParkingSquare />} color="primary" />
                    // Leaving this commented out for the time being since parking is not implemented as a feature yet
                )*/}
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
                    <IconButton
                        icon={<VscTarget />}
                        onClick={zeroAllAxes}
                        disabled={!canClick}
                    >
                        Zero
                    </IconButton>
                ) : (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <IconButton
                                icon={<VscTarget />}
                                disabled={!canClick}
                            >
                                Zero
                            </IconButton>
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
                {homingEnabled && singleAxisHoming && (
                    <HomingSwitch
                        onChange={toggleHoming}
                        homingValue={homingMode}
                        disabled={!canClick}
                    />
                )}

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
