import Button from 'app/components/Button';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import { GRBLHAL } from 'app/constants';
import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import controller from 'app/lib/controller.ts';
import { i18n, useAppTranslation } from 'app/i18n';
import { firmwareSemver } from 'app/lib/firmwareSemver.ts';
import store from 'app/store';
import type { RootState } from 'app/store/redux';
import { delay } from 'lodash';
import { toast } from 'sonner';

// Check firmware
// Check firmware version
// Send EEPROM
// Enable ATCi tab
// Prompt to restart
function enableATCiWizard(firmware, version) {
    if (firmware !== GRBLHAL) {
        toast.error(i18n.t('config:wizards.atciRequiresGrblHal'));
    }
    if (!firmwareSemver(version.semver, ATCI_SUPPORTED_VERSION)) {
        toast.error(
            i18n.t('config:wizards.atciMinVersion', {
                version: ATCI_SUPPORTED_VERSION,
            }),
        );
    }

    const code = [
        '$485=1',
        '$675=2',
        '$6=1',
        '$370=0',
        '$372=8',
        '$752=0',
        '$753=1',
        '$762=2',
        '$763=3',
        '$650=1',
        '$534=1',
    ];
    controller.command('gcode', code);
    store.set('workspace.atcEnabled', true);

    delay(() => {
        Confirm({
            title: i18n.t('config:wizards.atciRestartTitle'),
            content: i18n.t('config:wizards.atciRestartMessage'),
            confirmLabel: i18n.t('common:actions.ok'),
            hideClose: true,
        });
    }, 500);
}

export function ATCIWizard() {
    const { t } = useAppTranslation();
    const controllerType = useTypedSelector(
        (state: RootState) => state.controller.type,
    );
    const version = useTypedSelector(
        (state: RootState) => state.controller.settings.version,
    );
    return (
        <div className="flex flex-row gap-4 items-center">
            <Button
                className={'flex flex-row justify-start'}
                onClick={() => enableATCiWizard(controllerType, version)}
            >
                <span>{t('config:wizards.configureAtci')}</span>
            </Button>
        </div>
    );
}
