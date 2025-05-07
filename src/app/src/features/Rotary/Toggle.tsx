import Switch from 'app/components/Switch';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { WORKSPACE_MODE } from 'app/constants';
import { updateWorkspaceMode } from 'app/lib/rotary';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

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

    return (
        <div className="flex items-center gap-2 dark:text-white">
            {controllerType === 'grblHAL' && <span>4-Axis</span>}
            <Switch
                checked={mode === WORKSPACE_MODE.ROTARY}
                onChange={handleToggle}
                disabled={!connected}
            />
            <span>Rotary</span>
        </div>
    );
};

export default Toggle;
