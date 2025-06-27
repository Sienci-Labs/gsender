import { useTypedSelector } from 'app/hooks/useTypedSelector';

import { SpindleLaserStatusVariant } from './SpindleLaserStatusVariant';
import store from 'app/store';

const SpindleLaserStatus = () => {
    const { isConnected } = useTypedSelector((state) => state.connection);
    const { settings } = useTypedSelector((state) => state.controller.settings);
    const { spindle } = useTypedSelector((state) => state.controller.modal);
    const spindleFunctions = store.get('workspace.spindleFunctions', false);
    const spindleOn = spindleFunctions && spindle !== 'M5';

    if (!isConnected || !spindleOn) return null;

    return (
        <div className="absolute left-1/2 ml-56 flex max-sm:hidden">
            <SpindleLaserStatusVariant
                label={settings.$32 === '0' ? 'Spindle' : 'Laser'}
                color={
                    spindleOn
                        ? settings.$32 === '0'
                            ? 'spindle'
                            : 'laser'
                        : 'disabled'
                }
            />
        </div>
    );
};

export default SpindleLaserStatus;
