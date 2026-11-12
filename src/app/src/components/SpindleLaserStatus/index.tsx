import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useAppTranslation } from 'app/i18n';
import store from 'app/store';
import { SpindleLaserStatusVariant } from './SpindleLaserStatusVariant';

const SpindleLaserStatus = () => {
    const { t } = useAppTranslation();
    const { isConnected } = useTypedSelector((state) => state.connection);
    const { settings } = useTypedSelector((state) => state.controller.settings);
    const { spindle } = useTypedSelector((state) => state.controller.modal);
    const spindleFunctions = store.get('workspace.spindleFunctions', false);
    const spindleOn = spindleFunctions && spindle !== 'M5';

    if (!isConnected || !spindleOn) return null;

    return (
        <div className="absolute left-1/2 ml-56 flex max-sm:hidden">
            <SpindleLaserStatusVariant
                label={
                    settings.$32 === '0'
                        ? t('common:spindleLaser.spindle')
                        : t('common:spindleLaser.laser')
                }
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
