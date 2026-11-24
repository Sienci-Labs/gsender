import { cancelJog } from 'app/features/Jogging/utils/Jogging';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { useDroGating } from './useDroGating';

/** Shared E-STOP action for the pendant (top bar + run panel). */
export function useEStop() {
    const { isConnected } = useDroGating();
    const activeState = useTypedSelector(
        (s: RootState) => s.controller.state.status?.activeState ?? '',
    );
    const controllerType = useTypedSelector(
        (s: RootState) => s.controller.type,
    );

    const eStop = () => {
        if (!isConnected) return;
        cancelJog(activeState as any, controllerType);
    };

    return { isConnected, eStop };
}
