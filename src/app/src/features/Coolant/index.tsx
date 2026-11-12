import { usePostHog } from '@posthog/react';
import { ActiveStateButton } from 'app/components/ActiveStateButton';
import {
    GRBL,
    GRBL_ACTIVE_STATE_IDLE,
    GRBLHAL,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import {
    startFlood,
    startMist,
    stopCoolant,
} from 'app/features/Coolant/utils/actions';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useAppTranslation } from 'app/i18n';
import ensureArray from 'ensure-array';
import get from 'lodash/get';
import includes from 'lodash/includes';
import { useCallback } from 'react';
import { FaWater } from 'react-icons/fa';
import { FaBan, FaShower } from 'react-icons/fa6';
import { connect, shallowEqual } from 'react-redux';

export interface CoolantProps {
    mistActive: boolean;
    floodActive: boolean;
}

export function Coolant({ mistActive, floodActive }: CoolantProps) {
    const { t } = useAppTranslation();
    const { workflow, isConnected, controllerState, controllerType } =
        useTypedSelector(
            (state) => ({
                workflow: state.controller.workflow,
                isConnected: state.connection.isConnected ?? false,
                controllerState: state.controller.state ?? {},
                controllerType: state.controller.type ?? 'grbl',
            }),
            shallowEqual,
        );

    const canClick = useCallback((): boolean => {
        if (!isConnected) return false;
        if (workflow.state === WORKFLOW_STATE_RUNNING) return false;
        if (![GRBL, GRBLHAL].includes(controllerType)) return false;

        const activeState = controllerState?.status?.activeState;
        return activeState === GRBL_ACTIVE_STATE_IDLE;
    }, [
        isConnected,
        workflow.state,
        controllerType,
        controllerState?.status?.activeState,
    ]);

    const posthog = usePostHog();

    return (
        <div className="flex flex-col justify-around items-center h-full">
            <div className="flex flex-row justify-center w-full gap-2">
                <ActiveStateButton
                    text={t('workspace:coolant.mist')}
                    icon={<FaShower />}
                    onClick={() => {
                        startMist();
                        posthog?.capture('coolant_mist_started');
                    }}
                    className="h-16"
                    size="md"
                    active={isConnected && mistActive}
                    disabled={!canClick()}
                    tooltip={{ content: t('workspace:coolant.mistTooltip') }}
                />
                <ActiveStateButton
                    text={t('workspace:coolant.flood')}
                    icon={<FaWater />}
                    onClick={() => {
                        startFlood();
                        posthog?.capture('coolant_flood_started');
                    }}
                    className="h-16"
                    size="md"
                    active={isConnected && floodActive}
                    disabled={!canClick()}
                    tooltip={{ content: t('workspace:coolant.floodTooltip') }}
                />
                <ActiveStateButton
                    text={t('workspace:coolant.off')}
                    icon={<FaBan />}
                    onClick={() => {
                        stopCoolant();
                        posthog?.capture('coolant_off');
                    }}
                    className="h-16"
                    size="md"
                    disabled={!canClick()}
                    tooltip={{ content: t('workspace:coolant.offTooltip') }}
                />
            </div>
        </div>
    );
}

export default connect((state) => {
    const coolantModal: string = get(state, 'controller.modal.coolant', 'M9');
    const coolantArray = ensureArray(coolantModal);

    const mistActive = includes(coolantArray, 'M7');
    const floodActive = includes(coolantArray, 'M8');
    return {
        mistActive,
        floodActive,
    };
})(Coolant);
