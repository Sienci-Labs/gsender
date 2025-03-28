import { useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from 'app/components/shadcn/Dialog';
import Button from 'app/components/Button';
import { RadioGroup, RadioGroupItem } from 'app/components/shadcn/RadioGroup';
import { toast } from 'app/lib/toaster';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';
import { TOOLBAR_CATEGORY, VISUALIZER_PRIMARY } from 'app/constants';
import controller from 'app/lib/controller';

import standardTrackGraphic from './assets/standard-track-top-view.png';
import extensionTrackGraphic from './assets/extension-track-top-view.png';
import customTrackGraphic from './assets/custom-boring-track-top-view.png';
import { HOLE_TYPES } from './utils/mountingSetupMacros';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import useKeybinding from 'app/lib/useKeybinding';

const MountingSetup = () => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState({
        'mounting-track-lines-up': {
            label: 'Does the mounting track line up without interference?',
            subOptions: [
                {
                    label: 'Lines up',
                    value: 'lines-up',
                },
                {
                    label: 'Does not line up',
                    value: 'does-not-line-up',
                },
            ],
            value: 'does-not-line-up',
        },
        'end-mill-diameter': {
            label: 'End Mill Diameter',
            subOptions: [
                {
                    label: '¼"',
                    value: 'quarter-inch',
                },
                {
                    label: '⅛"',
                    value: 'eighth-inch',
                },
            ],
            value: 'quarter-inch',
        },
        'number-of-holes': {
            label: 'Number of Holes',
            subOptions: [
                {
                    label: '6',
                    value: 'six',
                },
                {
                    label: '10',
                    value: 'ten',
                },
            ],
            value: 'six',
        },
        'extension-track-length': {
            label: 'Extension Track Length',
            subOptions: [
                {
                    label: '400mm',
                    value: 'four-hundred',
                },
                {
                    label: '600mm',
                    value: 'six-hundred',
                },
            ],
            value: 'four-hundred',
        },
    });

    const getIllustrationImage = () => {
        const {
            'mounting-track-lines-up': { value: linesUp },
            'number-of-holes': { value: numberOfHoles },
        } = options;

        if (linesUp === 'does-not-line-up') {
            return customTrackGraphic;
        }

        if (numberOfHoles === 'six') {
            return standardTrackGraphic;
        }

        if (numberOfHoles === 'ten') {
            return extensionTrackGraphic;
        }

        return standardTrackGraphic;
    };

    const handleSubmit = async () => {
        const {
            'mounting-track-lines-up': { value: linesUp },
            'end-mill-diameter': { value: endMillDiameter },
            'number-of-holes': { value: numberOfHoles },
            'extension-track-length': { value: extensionTrackLength },
        } = options;

        let gcode = HOLE_TYPES.DOESNT_LINE_UP_QUARTER;
        let localNumberOfHoles = numberOfHoles;

        const setupKey = `${linesUp}-${endMillDiameter}-${numberOfHoles}-${extensionTrackLength}`;

        switch (setupKey) {
            // Custom mounting solution cases (2 holes)
            case 'does-not-line-up-quarter-inch-six-four-hundred':
            case 'does-not-line-up-quarter-inch-six-six-hundred':
            case 'does-not-line-up-quarter-inch-ten-four-hundred':
            case 'does-not-line-up-quarter-inch-ten-six-hundred':
                gcode = HOLE_TYPES.DOESNT_LINE_UP_QUARTER;
                localNumberOfHoles = 'two';
                break;

            case 'does-not-line-up-eighth-inch-six-four-hundred':
            case 'does-not-line-up-eighth-inch-six-six-hundred':
            case 'does-not-line-up-eighth-inch-ten-four-hundred':
            case 'does-not-line-up-eighth-inch-ten-six-hundred':
                gcode = HOLE_TYPES.DOESNT_LINE_UP_EIGHTH;
                localNumberOfHoles = 'two';
                break;

            // Standard 30" track with 6 holes
            case 'lines-up-quarter-inch-six-four-hundred':
            case 'lines-up-quarter-inch-six-six-hundred':
                gcode = HOLE_TYPES.QUARTER_INCH_SIX_HOLES;
                break;

            case 'lines-up-eighth-inch-six-four-hundred':
            case 'lines-up-eighth-inch-six-six-hundred':
                gcode = HOLE_TYPES.EIGHTH_INCH_SIX_HOLES;
                break;

            // 30" track with extension (10 holes)
            case 'lines-up-quarter-inch-ten-six-hundred':
                gcode = HOLE_TYPES.QUARTER_INCH_TEN_HOLES;
                break;

            case 'lines-up-eighth-inch-ten-six-hundred':
                gcode = HOLE_TYPES.EIGHTH_INCH_TEN_HOLES;
                break;

            // 30" track with shorter extension
            case 'lines-up-quarter-inch-ten-four-hundred':
                gcode = HOLE_TYPES.QUARTER_INCH_TEN_HOLES_SHORT;
                break;

            case 'lines-up-eighth-inch-ten-four-hundred':
                gcode = HOLE_TYPES.EIGHTH_INCH_TEN_HOLES_SHORT;
                break;

            default:
                console.assert(false, 'Invalid combination, check options');
                break;
        }

        const file = new File([gcode], 'gSender_Rotary_Mounting_Setup');

        await uploadGcodeFileToServer(
            file,
            controller.port,
            VISUALIZER_PRIMARY,
        );

        toast.info('Loaded rotary mounting setup macro');

        setOpen(false);
    };

    const shuttleControlEvents = {
        TOGGLE_MOUNTING_SETUP: {
            title: 'Toggle Mounting Setup Display',
            keys: '',
            cmd: 'TOGGLE_MOUNTING_SETUP',
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
            callback: () => setOpen((prev) => !prev),
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" onClick={() => setOpen(true)}>
                    Mounting Setup
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-white w-11/12 max-w-6xl">
                <DialogHeader>
                    <DialogTitle>Rotary Mounting Setup</DialogTitle>

                    <DialogDescription>
                        Make sure your router is mounted as far down as possible
                        with the bit inserted not too far into the collet to
                        prevent bottoming out.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col justify-between gap-8">
                    {Object.entries(options).map(([key, option]) => (
                        <div key={key} className="grid grid-cols-2 gap-2">
                            <p>{option.label}</p>
                            <RadioGroup
                                value={option.value}
                                onValueChange={(value) =>
                                    setOptions({
                                        ...options,
                                        [key]: { ...option, value },
                                    })
                                }
                                className="grid-cols-2"
                            >
                                {option.subOptions.map((subOption) => (
                                    <div
                                        key={subOption.value}
                                        className="flex items-center gap-2"
                                    >
                                        <RadioGroupItem
                                            key={subOption.value}
                                            value={subOption.value}
                                            size="sm"
                                        />
                                        <p>{subOption.label}</p>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col gap-2 min-h-[400px] justify-center">
                    <img
                        src={getIllustrationImage()}
                        alt="Mounting Setup"
                        className="w-full self-center"
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit}>
                        Load G-Code to Visualizer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MountingSetup;
