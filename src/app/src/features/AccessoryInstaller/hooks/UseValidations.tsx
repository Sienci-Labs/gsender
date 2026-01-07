import { useMemo } from 'react';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';

export function useValidations() {
    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const hasHomed = useTypedSelector(
        (state: RootState) => state.controller.state?.status?.hasHomed,
    );

    const connectionValidation = useMemo(
        () => () => ({
            success: isConnected,
            reason: 'Your controller is not connected.  Connect to your controller to configure your Sienci ATC.',
        }),
        [isConnected],
    );
    const homingValidation = useMemo(
        () => () => ({
            success: hasHomed,
            reason: 'Machine not homed. Please home your machine before proceeding with ATC configuration.',
        }),
        [hasHomed],
    );

    return {
        connectionValidation,
        homingValidation,
    };
}
