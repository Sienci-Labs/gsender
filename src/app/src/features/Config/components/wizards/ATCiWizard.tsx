import Button from "app/components/Button";

function enableATCiWizard() {
    // Check firmware
    // Check firmware version
    // Send EEPROM
    // Enable ATCi tab
    // Prompt to restart
}

export function ATCIWizard() {
    return (
        <div className="flex flex-row gap-4 items-center">
            <Button className={'flex flex-row justify-start'} onClick={enableATCiWizard}>
                <span>Configure Sienci ATCi</span>
            </Button>
        </div>
    )
}
