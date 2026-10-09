import {
    GRBL,
    GRBL_ACTIVE_STATE_IDLE,
    GRBLHAL,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import ensureArray from 'ensure-array';
import get from 'lodash/get';
import includes from 'lodash/includes';
import { useCallback } from 'react';

/** Coolant modal state and click gating, shared by CoolantPanel and Prep. */
export function useCoolant() {
    const { workflow, isConnected, controllerState, controllerType } =
        useTypedSelector((s: RootState) => ({
            workflow: s.controller.workflow,
            isConnected: s.connection.isConnected ?? false,
            controllerState: s.controller.state ?? {},
            controllerType: s.controller.type ?? 'grbl',
        }));

    const coolantModal: string = useTypedSelector((s: RootState) =>
        get(s, 'controller.modal.coolant', 'M9'),
    );

    const coolantArray = ensureArray(coolantModal);
    const mistActive = includes(coolantArray, 'M7');
    const floodActive = includes(coolantArray, 'M8');

    const canClick = useCallback((): boolean => {
        if (!isConnected) return false;
        if (workflow.state === WORKFLOW_STATE_RUNNING) return false;
        if (![GRBL, GRBLHAL].includes(controllerType)) return false;
        return (
            (controllerState as any)?.status?.activeState ===
            GRBL_ACTIVE_STATE_IDLE
        );
    }, [isConnected, workflow.state, controllerType, controllerState]);

    return {
        isConnected,
        mistActive,
        floodActive,
        clickable: canClick(),
    };
}
