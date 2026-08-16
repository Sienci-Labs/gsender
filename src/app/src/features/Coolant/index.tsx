import { connect } from 'react-redux';
import get from 'lodash/get';
import { FaShower, FaBan, FaWind, FaFan, FaBolt } from 'react-icons/fa6';
import { FaWater } from 'react-icons/fa';

import {
    startMist,
    startFlood,
    stopCoolant,
} from 'app/features/Coolant/utils/actions';
import {
    GRBL,
    GRBL_ACTIVE_STATE_IDLE,
    GRBLHAL,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import { ActiveStateButton } from 'app/components/ActiveStateButton';
import ensureArray from 'ensure-array';
import includes from 'lodash/includes';
import { useCallback } from 'react';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { usePostHog } from 'posthog-js/react';

export interface CoolantProps {
    mistActive: boolean;
    floodActive: boolean;
}

const getAccessoryIcon = (label: string, defaultCommand: 'M7' | 'M8') => {
    const normalized = (label || '').toLowerCase();
    if (normalized.includes('air') || normalized.includes('blow') || normalized.includes('laser')) {
        return <FaWind />;
    }
    if (normalized.includes('vac') || normalized.includes('dust') || normalized.includes('fan')) {
        return <FaFan />;
    }
    if (normalized.includes('flood') || normalized.includes('coolant') || normalized.includes('pump')) {
        return <FaWater />;
    }
    if (normalized.includes('mist') || normalized.includes('spray') || normalized.includes('drip')) {
        return <FaShower />;
    }
    if (normalized.includes('aux')) {
        return <FaBolt />;
    }
    return defaultCommand === 'M7' ? <FaShower /> : <FaWater />;
};

export function Coolant({ mistActive, floodActive }: CoolantProps) {
    const {
        m7Label = 'Mist',
        m7CustomLabel = '',
        m8Label = 'Flood',
        m8CustomLabel = '',
    } = useWorkspaceState();

    const finalM7Label = m7Label === 'Custom' ? (m7CustomLabel.trim() || 'M7') : m7Label;
    const finalM8Label = m8Label === 'Custom' ? (m8CustomLabel.trim() || 'M8') : m8Label;

    const m7Icon = getAccessoryIcon(finalM7Label, 'M7');
    const m8Icon = getAccessoryIcon(finalM8Label, 'M8');

    const { workflow, isConnected, controllerState, controllerType } =
        useTypedSelector((state) => ({
            workflow: state.controller.workflow,
            isConnected: state.connection.isConnected ?? false,
            controllerState: state.controller.state ?? {},
            controllerType: state.controller.type ?? 'grbl',
        }));

    const posthog = usePostHog();

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

    return (
        <div className="flex flex-col justify-around items-center h-full">
            <div className="flex flex-row justify-center w-full gap-2">
                <ActiveStateButton
                    text={finalM7Label}
                    icon={m7Icon}
                    onClick={() => {
                        startMist();
                        posthog.capture('coolant_mist_started');
                    }}
                    className="h-16"
                    size="md"
                    active={isConnected && mistActive}
                    disabled={!canClick()}
                    tooltip={{ content: `Turn on ${finalM7Label.toLowerCase()} (M7)` }}
                />
                <ActiveStateButton
                    text={finalM8Label}
                    icon={m8Icon}
                    onClick={() => {
                        startFlood();
                        posthog.capture('coolant_flood_started');
                    }}
                    className="h-16"
                    size="md"
                    active={isConnected && floodActive}
                    disabled={!canClick()}
                    tooltip={{ content: `Turn on ${finalM8Label.toLowerCase()} (M8)` }}
                />
                <ActiveStateButton
                    text="Off"
                    icon={<FaBan />}
                    onClick={() => {
                        stopCoolant();
                        posthog.capture('coolant_off');
                    }}
                    className="h-16"
                    size="md"
                    disabled={!canClick()}
                    tooltip={{ content: 'Turn off accessory outputs (M9)' }}
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
