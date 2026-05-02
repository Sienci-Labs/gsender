import Button from "app/components/Button";
import {useTypedSelector} from "app/hooks/useTypedSelector.ts";
import {RootState} from "app/store/redux";
import {GRBLHAL} from "app/constants";
import {toast} from "sonner";
import {ATCI_SUPPORTED_VERSION} from "app/features/ATC/utils/ATCiConstants.ts";
import {firmwareSemver} from "app/lib/firmwareSemver.ts";
import controller from "app/lib/controller.ts";
import {delay} from "lodash";
import {Confirm} from "app/components/ConfirmationDialog/ConfirmationDialogLib.ts";
import store from "app/store";


// Check firmware
// Check firmware version
// Send EEPROM
// Enable ATCi tab
// Prompt to restart
function enableATCiWizard(firmware, version) {
    if (firmware !== GRBLHAL) {
        toast.error("ATCi is only supported by boards running grblHAL.");
    }
    if (!firmwareSemver(version.semver, ATCI_SUPPORTED_VERSION)) {
        toast.error(`ATCi is only supported by grblHAL version ${ATCI_SUPPORTED_VERSION} or above.`);
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
        '$534=1'
    ]
    controller.command('gcode', code);
    store.set('workspace.atcEnabled', true);

    delay(() => {
        Confirm({
            title: 'ATCi - Restart your Controller',
            content:
                'Please manually restart your CNC controller (power cycle) and reconnect to gSender for these settings to take effect.',
            confirmLabel: 'OK',
            hideClose: true,
        });
    }, 500);
}

export function ATCIWizard() {
    const controllerType = useTypedSelector((state: RootState) => state.controller.type)
    const version = useTypedSelector((state: RootState) => state.controller.settings.version)
    return (
        <div className="flex flex-row gap-4 items-center">
            <Button className={'flex flex-row justify-start'} onClick={()  => enableATCiWizard(controllerType, version)}>
                <span>Configure Sienci ATCi</span>
            </Button>
        </div>
    )
}
