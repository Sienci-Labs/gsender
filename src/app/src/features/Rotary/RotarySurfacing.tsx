import { useState, useEffect } from 'react';

import { Button } from 'app/components/Button';
import { Input } from 'app/components/Input';
import { Label } from 'app/components/shadcn/Label';
import Switch from 'app/components/Switch';
import { Tabs, TabsList, TabsTrigger } from 'app/components/shadcn/Tabs';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import controller from 'app/lib/controller';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    TOOLBAR_CATEGORY,
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY,
} from 'app/constants';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';

import { GcodeViewer } from '../Surfacing/components/GcodeViewer';
import VisualizerPreview from './components/VisualizerPreview';
import { StockTurningGenerator } from './utils/Generator';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import useKeybinding from 'app/lib/useKeybinding';
import { useNavigate } from 'react-router';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import cx from 'classnames';

const InputArea = ({
    children,
    label,
}: {
    children: React.ReactNode;
    label: string;
}) => {
    return (
        <div className="grid grid-cols-5 items-center gap-4">
            <Label htmlFor={label} className="col-span-2">
                {label}
            </Label>
            {children}
        </div>
    );
};

// Default values in mm
const DEFAULT_VALUES_MM = {
    length: 100,
    startDiameter: 50,
    finalDiameter: 40,
    stepdown: 20,
    bitDiameter: 6.35,
    stepover: 15,
    spindleRPM: 17000,
    feedrate: 3000,
    enableRehoming: false,
};

// Conversion factor from mm to inches
const MM_TO_INCH = 0.0393701;

const RotarySurfacing = () => {
    const navigate = useNavigate();
    const { units } = useWorkspaceState();
    const status = useTypedSelector((state) => state?.controller.state?.status);
    const isDisabled =
        status?.activeState !== GRBL_ACTIVE_STATE_IDLE &&
        status?.activeState !== GRBL_ACTIVE_STATE_JOG;

    // Initialize state with appropriate units
    const getInitialState = () => {
        if (units === 'in') {
            return {
                length: Number(
                    (DEFAULT_VALUES_MM.length * MM_TO_INCH).toFixed(4),
                ),
                startDiameter: Number(
                    (DEFAULT_VALUES_MM.startDiameter * MM_TO_INCH).toFixed(4),
                ),
                finalDiameter: Number(
                    (DEFAULT_VALUES_MM.finalDiameter * MM_TO_INCH).toFixed(4),
                ),
                stepdown: Number(
                    (DEFAULT_VALUES_MM.stepdown * MM_TO_INCH).toFixed(4),
                ),
                bitDiameter: Number(
                    (DEFAULT_VALUES_MM.bitDiameter * MM_TO_INCH).toFixed(4),
                ),
                feedrate: Number(
                    (DEFAULT_VALUES_MM.feedrate * MM_TO_INCH).toFixed(4),
                ),
                stepover: DEFAULT_VALUES_MM.stepover,
                spindleRPM: DEFAULT_VALUES_MM.spindleRPM,
                enableRehoming: DEFAULT_VALUES_MM.enableRehoming,
            };
        }
        return { ...DEFAULT_VALUES_MM };
    };

    const [surfacingState, setSurfacingState] = useState(getInitialState());
    const [gcode, setGcode] = useState('');
    const [tabSwitch, setTabSwitch] = useState(false);

    // Update state when units change
    useEffect(() => {
        setSurfacingState(getInitialState());
    }, [units]);

    const inputStyle =
        'text-xl font-light z-0 align-center text-center text-blue-500 pl-1 pr-1 w-full';

    const handleGenerateGcode = () => {
        const generator = new StockTurningGenerator({
            stockLength: +surfacingState.length,
            stepdown: +surfacingState.stepdown,
            bitDiameter: +surfacingState.bitDiameter,
            spindleRPM: +surfacingState.spindleRPM,
            feedrate: +surfacingState.feedrate,
            stepover: +surfacingState.stepover,
            startHeight: +surfacingState.startDiameter,
            finalHeight: +surfacingState.finalDiameter,
            enableRehoming: surfacingState.enableRehoming,
        });

        const gcode = generator.generate();
        setGcode(gcode);

        const name = 'gSender_Surfacing';
        const file = new File([gcode], name);

        uploadGcodeFileToServer(file, controller.port, VISUALIZER_SECONDARY);
    };

    const handleLoadToMainVisualizer = async () => {
        const file = new File([gcode], 'gSender_Rotary_Surfacing');

        await uploadGcodeFileToServer(
            file,
            controller.port,
            VISUALIZER_PRIMARY,
        );

        setGcode('');

        navigate('/');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;

        setSurfacingState((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const shuttleControlEvents = {
        TOGGLE_ROTARY_SURFACING: {
            title: 'Toggle Rotary Surfacing Display',
            keys: '',
            cmd: 'TOGGLE_ROTARY_SURFACING',
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
            callback: () => navigate('/tools/rotary-surfacing'),
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    return (
        <div>
            <div className="bg-white dark:bg-transparent dark:text-white w-full flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-4 xl:gap-2">
                        <p className="text-sm xl:text-base">
                            Make sure that your tool clears the surface of your
                            material without running into the limits of your
                            Z-axis. You should also use the probing feature to
                            zero your Z-axis to the centerline before surfacing.
                        </p>
                        <InputArea label="Length">
                            <Input
                                id="length"
                                value={surfacingState.length}
                                onChange={handleChange}
                                wrapperClassName="col-span-3"
                                className={inputStyle}
                                suffix={units}
                            />
                        </InputArea>
                        <InputArea label="Start & Final Diameter">
                            <div className="grid grid-cols-[3fr_10px_3fr] gap-2 col-span-3">
                                <Input
                                    id="startDiameter"
                                    value={surfacingState.startDiameter}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    suffix={units}
                                />
                                <span className="flex justify-center items-center">
                                    &
                                </span>
                                <Input
                                    id="finalDiameter"
                                    value={surfacingState.finalDiameter}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    suffix={units}
                                />
                            </div>
                        </InputArea>
                        <InputArea label="Stepdown">
                            <Input
                                id="stepdown"
                                value={surfacingState.stepdown}
                                onChange={handleChange}
                                wrapperClassName="col-span-3"
                                className={inputStyle}
                                suffix={units}
                            />
                        </InputArea>
                        <InputArea label="Bit Diameter">
                            <Input
                                id="bitDiameter"
                                value={surfacingState.bitDiameter}
                                onChange={handleChange}
                                wrapperClassName="col-span-3"
                                className={inputStyle}
                                suffix={units}
                            />
                        </InputArea>
                        <InputArea label="Stepover">
                            <Input
                                id="stepover"
                                value={surfacingState.stepover}
                                onChange={handleChange}
                                wrapperClassName="col-span-3"
                                className={inputStyle}
                                suffix="%"
                            />
                        </InputArea>
                        <InputArea label="Spindle RPM">
                            <Input
                                id="spindleRPM"
                                value={surfacingState.spindleRPM}
                                onChange={handleChange}
                                wrapperClassName="col-span-3"
                                className={inputStyle}
                                suffix="RPM"
                            />
                        </InputArea>
                        <InputArea label="Feedrate">
                            <Input
                                id="feedrate"
                                value={surfacingState.feedrate}
                                onChange={handleChange}
                                wrapperClassName="col-span-3"
                                className={inputStyle}
                                suffix={`${units}/min`}
                            />
                        </InputArea>

                        <div>
                            <InputArea label="Enable Rehoming">
                                <Switch
                                    id="enableRehoming"
                                    checked={surfacingState.enableRehoming}
                                    onChange={(checked) =>
                                        setSurfacingState((prev) => ({
                                            ...prev,
                                            enableRehoming: checked,
                                        }))
                                    }
                                />
                            </InputArea>
                            <div className="text-xs xl:text-sm text-gray-500 mt-3">
                                This option creates a more consistent surface
                                finish as your A axis will spin in only one
                                direction across the entire length of your
                                material. You will however need to rehome after
                                surfacing to reset your A axis coordinates.
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Tabs defaultValue="visualizer">
                            <TabsList className="bg-gray-100 w-full">
                                <TabsTrigger
                                    value="visualizer"
                                    className="w-full"
                                    onClick={() => setTabSwitch(false)}
                                >
                                    Visualizer Preview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="gcode"
                                    className="w-full"
                                    onClick={() => setTabSwitch(true)}
                                >
                                    G-Code{' '}
                                    {gcode.length !== 0 ? (
                                        <span className="text-xs text-gray-500">
                                            ({gcode.split('\n').length} lines)
                                        </span>
                                    ) : null}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="relative w-[calc(100vw/2] h-[calc(100vh-224px-40px)]">
                            <div
                                className={cx(
                                    'absolute w-full h-full top-0 left-0 rounded-md',
                                    {
                                        invisible: tabSwitch,
                                    },
                                )}
                            >
                                <VisualizerPreview gcode={gcode} />
                            </div>
                            <div
                                className={cx('h-full rounded-md relative', {
                                    invisible: !tabSwitch,
                                })}
                            >
                                <GcodeViewer gcode={gcode} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row gap-4">
                    <Button type="submit" onClick={handleGenerateGcode}>
                        Generate G-Code
                    </Button>
                    <Button
                        disabled={!!!gcode || isDisabled}
                        onClick={handleLoadToMainVisualizer}
                    >
                        Load to Main Visualizer
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RotarySurfacing;
