import { useTypedSelector } from 'app/hooks/useTypedSelector';

import { SpindleLaserStatusVariant } from './SpindleLaserStatusVariant';

const SpindleLaserStatus = () => {
    const { isConnected } = useTypedSelector((state) => state.connection);
    const { settings } = useTypedSelector((state) => state.controller.settings);
    const { spindle } = useTypedSelector((state) => state.controller.modal);

    if (!isConnected) return null;

    const spindleOn = spindle !== 'M5';

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

    if (!spindleOn) {
        return <></>;
    }
    return <div className="absolute top-4 left-1/2 flex ml-52">{label}</div>;
};

export default SpindleLaserStatus;