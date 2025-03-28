import {
    Axis,
    handleManualOffset,
    homeAxis,
} from 'app/features/DRO/utils/DRO.ts';
import { Button } from 'app/components/Button';
import { zeroWCS, gotoZero } from '../utils/DRO.ts';
import { WCSInput } from 'app/features/DRO/component/WCSInput.tsx';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState.ts';
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

interface AxisRowProps {
    axis: Axis;
    mpos: string;
    wpos: string;
    disabled: boolean;
    key: string;
    homingMode: boolean;
}

export function AxisRow({
    axis,
    mpos,
    wpos,
    disabled,
    homingMode,
}: AxisRowProps) {
    const { shouldWarnZero } = useWorkspaceState();

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded w-full flex flex-row items-stretch justify-between flex-1">
            {homingMode || !shouldWarnZero ? (
                <Button
                    onClick={() => {
                        if (homingMode) {
                            homeAxis(axis);
                        } else {
                            zeroWCS(axis, 0);
                        }
                    }}
                    disabled={disabled}
                    variant={homingMode ? 'alt' : 'secondary'}
                    size="sm"
                >
                    <span className="font-bold font-mono text-xl transition-all transition-duration-300">
                        {`${homingMode ? 'H' : ''}${axis}${homingMode ? '' : '0'}`}
                    </span>
                </Button>
            ) : (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            disabled={disabled}
                            variant="secondary"
                            size="sm"
                        >
                            <span className="font-bold font-mono text-xl transition-all transition-duration-300">
                                {`${axis}0`}
                            </span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Zero {axis} Axis
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to zero the {axis} axis?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => zeroWCS(axis, 0)}>
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            <WCSInput
                disabled={disabled}
                value={wpos}
                axis={axis}
                movementHandler={handleManualOffset}
            />

            <span className="font-mono flex items-center text-sm text-gray-400 w-[9ch] text-center">
                {mpos}
            </span>

            <Button
                disabled={disabled}
                onClick={() => gotoZero(axis)}
                variant="alt"
                size="sm"
            >
                <span className="text-lg font-mono">{axis}</span>
            </Button>
        </div>
    );
}
