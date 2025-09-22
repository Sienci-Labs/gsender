import { Switch } from 'app/components/shadcn/Switch';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { WORKSPACE_MODE } from 'app/constants';
import { updateWorkspaceMode } from 'app/lib/rotary';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import Tooltip from 'app/components/Tooltip';

const Toggle = () => {
    const { mode } = useWorkspaceState();
    const { type: controllerType } = useTypedSelector(
        (state) => state.controller,
    );
    const connected = useTypedSelector((state) => state.connection.isConnected);

    const handleToggle = (checked: boolean) => {
        updateWorkspaceMode(
            checked ? WORKSPACE_MODE.ROTARY : WORKSPACE_MODE.DEFAULT,
        );
    };

    const tooltipContent =
        controllerType === 'grblHAL'
            ? 'Toggle between 4-axis and rotary mode'
            : 'Toggle rotary mode';

    return (
        <div className="flex items-center gap-2 dark:text-white">
            {controllerType === 'grblHAL' && <span>4-Axis</span>}
            <Tooltip content={tooltipContent}>
                <div>
                    <Switch
                        checked={mode === WORKSPACE_MODE.ROTARY}
                        onChange={handleToggle}
                        disabled={!connected}
                    />
                </div>
            </Tooltip>
            <span>Rotary</span>
        </div>
    );
};

export default Toggle;
