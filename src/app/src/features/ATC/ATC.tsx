import { ToolDisplay } from 'app/features/ATC/components/ToolDisplay.tsx';
import { AdvancedOptions } from 'app/features/ATC/components/AdvancedOptions.tsx';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
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

    /*if (unavailableATCPayload !== null) {
        return <ATCUnavailable payload={unavailableATCPayload} />;
    }*/

    return (
        <div className="w-full h-full box-border">
            <ATCStartValidations
                show={showValidator}
                setShow={setShowValidator}
                payload={validationPayload}
            />
            <div className="grid w-full h-full grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
                <div className="flex h-full flex-col">
                    <ToolDisplay />
                </div>
                <div className="flex h-full flex-col">
                    <AdvancedOptions />
                </div>
            </div>
        </div>
    );
}
