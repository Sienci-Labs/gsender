import { ToolDisplayModal } from 'app/features/ATC/components/ToolDisplayModal.tsx';
import { ToolDisplay } from 'app/features/ATC/components/ToolDisplay.tsx';
import { AdvancedOptions } from 'app/features/ATC/components/AdvancedOptions.tsx';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { ATCUnavailable } from 'app/features/ATC/components/ATCUnavailable.tsx';
import { ATCIConfiguration } from 'app/features/ATC/components/Configuration';
import { useEffect, useState } from 'react';
import { ATCStartValidations } from 'app/features/ATC/components/ATCStartValidations.tsx';
import pubsub from 'pubsub-js';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { getATCUnavailablePayload } from 'app/features/ATC/utils';

export function ATC() {
    const { atcAvailable, connected } = useToolChange();
    const [showValidator, setShowValidator] = useState(false);
    const [validationPayload, setValidationPayload] = useState({});
    const isHomed = useTypedSelector((state) => state.controller.homingFlag);

    useEffect(() => {
        pubsub.subscribe('atc_validator', (k, payload) => {
            setValidationPayload(payload);
            setShowValidator(true);
        });
        return () => {
            pubsub.unsubscribe('atc_validator');
        };
    }, []);

    const unavailableATCPayload = getATCUnavailablePayload({
        isConnected: connected,
        isATCAvailable: atcAvailable,
        isHomed: isHomed,
    });

    if (unavailableATCPayload !== null) {
        return <ATCUnavailable payload={unavailableATCPayload} />;
    }

    return (
        <div className="w-full relative box-border">
            <ATCStartValidations
                show={showValidator}
                setShow={setShowValidator}
                payload={validationPayload}
            />
            <div className="flex flex-row items-center justify-end absolute top-2 right-2">
                <ATCIConfiguration />
                <ToolDisplayModal />
            </div>
            <div className="grid grid-cols-[3fr_2fr] gap-0">
                <div>
                    <ToolDisplay />
                </div>
                <AdvancedOptions />
            </div>
        </div>
    );
}
