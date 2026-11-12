import { useAppTranslation } from 'app/i18n';
import { PinIndicator } from 'app/features/MachineInfo/PinRow.tsx';
import type { RootState } from 'app/store/redux';
import get from 'lodash/get';
import { useSelector } from 'react-redux';

export function ProbePinStatus() {
    const { t } = useAppTranslation();
    // Select the pin itself; the status object is replaced on every report
    const probeOn = useSelector((state: RootState) =>
        Boolean(get(state.controller.state.status, 'pinState.P', false)),
    );

    return (
        <div className="flex flex-row items-center gap-2">
            <span className="dark:text-content-primary">
                {t('config:wizards.probePin')}
            </span>
            <PinIndicator on={probeOn} />
        </div>
    );
}
