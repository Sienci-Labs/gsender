import { Button } from 'app/components/Button';
import controller from 'app/lib/controller.ts';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { GRBLHAL } from 'app/constants';
import delay from 'lodash/delay';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import autoSpinIcon from 'app/features/Config/assets/images/autospin.svg';

function startSpindle() {
    controller.command('gcode', 'M3 S1000');
}
function startSpindleCCW() {
    controller.command('gcode', 'M4 S1000');
}
function stopSpindle() {
    controller.command('gcode', 'M5 S0');
}

function autospinSetup(firmwareType: string = null) {
    if (!firmwareType) {
        return console.assert('No firmware type detected, failing early');
    }

    if (firmwareType === GRBLHAL) {
        controller.command('gcode', [
            '$9 = 1',
            'G4P0.1',
            '$16 = 0',
            'G4P0.1',
            '$30 = 30000',
            'G4P0.1',
            '$31 = 10000',
            'G4P0.1',
            '$33 = 1000',
            'G4P0.1',
            '$34 = 0',
            'G4P0.1',
            '$35 = 30',
            'G4P0.1',
            '$36 = 90',
            'G4P0.1',
            '$395 = 0',
            'G4P0.1',
            ';Flash onboard LED to confirm',
            'M356 P0 Q2',
            'M356 P1 Q2',
            'G4P0.1',
            'M356 P0 Q1',
            'M356 P1 Q1',
            'M356 P0 Q2',
            'M356 P1 Q2',
            'G4P0.1',
            'M356 P0 Q1',
            'M356 P1 Q1',
            'M356 P0 Q0',
            'M356 P1 Q0',
            '(End of Macro 1)',
            '(Reset)',
            'M2',
            'G4P0.1',
            '$$',
        ]);
    } else {
        controller.command('gcode', [
            'G4P0.1',
            '$31=1',
            'G4P0.1',
            '$30=31250',
            'G4P0.1',
            '$$',
        ]);
    }

    delay(() => {
        Confirm({
            title: 'Restart your Controller',
            content:
                'Please manually restart your CNC controller (power cycle) and reconnect to gSender for these settings to take effect.',
            confirmLabel: 'OK',
            hideClose: true,
        });
    }, 500);
}

function AutoSpinIcon() {
    return (
        <img
            src={autoSpinIcon}
            alt="AutoSpin Icon"
            className="h-7 w-7 text-blue-500 fill-blue-500"
        />
    );
}

export function SpindleWizard() {
    const connected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const firmwareType = useSelector(
        (state: RootState) => state.controller.type,
    );

    return (
        <div className="flex flex-row gap-2 items-center">
            <Button variant="primary" onClick={startSpindle}>
                For
            </Button>
            <Button variant="primary" onClick={startSpindleCCW}>
                Rev
            </Button>
            <Button variant="primary" onClick={stopSpindle}>
                Stop
            </Button>
            |
            <Button
                onClick={() => autospinSetup(firmwareType)}
                className={'flex flex-row justify-start'}
                disabled={!connected}
            >
                <AutoSpinIcon />
                Setup AutoSpin
            </Button>
        </div>
    );
}
