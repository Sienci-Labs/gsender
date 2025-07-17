import Button from "app/components/Button";
import {useTypedSelector} from "app/hooks/useTypedSelector.ts";
import {RootState} from "app/store/redux";
import {GRBLHAL} from "app/constants";
import {toast} from "sonner";
import {ATCI_SUPPORTED_VERSION} from "app/features/ATC/utils/ATCiConstants.ts";
import {firmwareSemver} from "app/lib/firmwareSemver.ts";
import controller from "app/lib/controller.ts";


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

    ]
    controller.command('gcode', code);
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
