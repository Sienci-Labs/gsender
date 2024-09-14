import { useTypedSelector } from 'app/hooks/useTypedSelector';

import { SpindleLaserStatusVariant } from './SpindleLaserStatusVariant';

const SpindleLaserStatus = () => {
    const {
        connection,
        controller: {
            settings: { settings },
            modal,
        },
    } = useTypedSelector((state) => state);

    if (!connection.isConnected) return null;

    const spindleOn = modal.spindle !== 'M5';

    const label = {
        '0': (
            <SpindleLaserStatusVariant
                label="Spindle"
                color={spindleOn ? 'spindle' : 'disabled'}
            />
        ),
        '1': (
            <SpindleLaserStatusVariant
                label="Laser"
                color={spindleOn ? 'laser' : 'disabled'}
            />
        ),
    }[settings.$32] || (
        <SpindleLaserStatusVariant label="Spindle" color="disabled" />
    );

    return <div className="absolute top-4 left-1/2 flex ml-52">{label}</div>;
};

export default SpindleLaserStatus;
