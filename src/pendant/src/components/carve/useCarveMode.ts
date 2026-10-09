import { useWizardContext } from 'app/features/Helper/context';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { type CarveMode, resolveCarveMode } from './carveMode';

export function useCarveMode(): CarveMode {
    const isConnected = useTypedSelector(
        (s: RootState) => s.connection.isConnected,
    );
    const workflowState = useTypedSelector(
        (s: RootState) => s.controller.workflow.state,
    );
    const activeState = useTypedSelector(
        (s: RootState) => s.controller.state?.status?.activeState ?? '',
    );
    const { visible: wizardVisible } = useWizardContext();

    return resolveCarveMode({
        isConnected,
        workflowState,
        activeState,
        wizardVisible,
    });
}
