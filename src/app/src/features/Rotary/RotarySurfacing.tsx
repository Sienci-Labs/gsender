import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import cx from 'classnames';

import { Button } from 'app/components/Button';
import { ControlledInput } from 'app/components/ControlledInput';
import { Switch } from 'app/components/shadcn/Switch';
import { Tabs, TabsList, TabsTrigger } from 'app/components/shadcn/Tabs';
import controller from 'app/lib/controller';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    IMPERIAL_UNITS,
    TOOLBAR_CATEGORY,
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY,
} from 'app/constants';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import useKeybinding from 'app/lib/useKeybinding';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { convertToImperial, convertToMetric } from 'app/lib/units';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import store from 'app/store';

import { RotarySurfacingOptions } from './definitions';
import { GcodeViewer } from '../Surfacing/components/GcodeViewer';
import VisualizerPreview from './components/VisualizerPreview';
import { StockTurningGenerator } from './utils/Generator';
import InputArea from './components/InputArea';
import { DEFAULT_VALUES_MM } from './constants';

const RotarySurfacing = () => {
    const navigate = useNavigate();
    const { units } = useWorkspaceState();
    const status = useTypedSelector((state) => state?.controller.state?.status);
    const [surfacingState, setSurfacingState] =
        useState<RotarySurfacingOptions>(getInitialState());
    const [gcode, setGcode] = useState('');
    const [tabSwitch, setTabSwitch] = useState(false);

    useEffect(() => {
        const saveState = () => {
            if (units === IMPERIAL_UNITS) {
                store.replace('rotary.stockTurning.options', {
                    ...surfacingState,
                    stockLength: convertToMetric(surfacingState.stockLength),
                    startHeight: convertToMetric(surfacingState.startHeight),
                    finalHeight: convertToMetric(surfacingState.finalHeight),
                    stepdown: convertToMetric(surfacingState.stepdown),
                    bitDiameter: convertToMetric(surfacingState.bitDiameter),
                    feedrate: convertToMetric(surfacingState.feedrate),
                });
            } else {
                store.replace('rotary.stockTurning.options', surfacingState);
            }
        };

        return saveState;
    }, [surfacingState]);

    // Initialize state with appropriate units
    function getInitialState(): RotarySurfacingOptions {
        const options = store.get(
            'rotary.stockTurning.options',
            DEFAULT_VALUES_MM,
        );

        if (units === IMPERIAL_UNITS) {
            return {
                ...options,
                stockLength: convertToImperial(options.stockLength),
                startHeight: convertToImperial(options.startHeight),
                finalHeight: convertToImperial(options.finalHeight),
                stepdown: convertToImperial(options.stepdown),
                bitDiameter: convertToImperial(options.bitDiameter),
                feedrate: convertToImperial(options.feedrate),
            };
        }

        return options;
    }

    const handleGenerateGcode = () => {
        const generator = new StockTurningGenerator({
            stockLength: +surfacingState.stockLength,
            startHeight: +surfacingState.startHeight,
            finalHeight: +surfacingState.finalHeight,
            stepdown: +surfacingState.stepdown,
            bitDiameter: +surfacingState.bitDiameter,
            feedrate: +surfacingState.feedrate,
            stepover: +surfacingState.stepover,
            spindleRPM: +surfacingState.spindleRPM,
            enableRehoming: surfacingState.enableRehoming,
            shouldDwell: surfacingState.shouldDwell,
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

    const isDisabled =
        status &&
        status?.activeState !== GRBL_ACTIVE_STATE_IDLE &&
        status?.activeState !== GRBL_ACTIVE_STATE_JOG;

    const inputStyle =
        'text-xl font-light z-0 align-center text-center text-blue-500 pl-1 pr-1 w-full';

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    return (
        <div>
            <div className="bg-white dark:bg-transparent dark:text-white w-full flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-4 xl:gap-2">
                        <p className="text-sm xl:text-base font-normal text-gray-500 dark:text-gray-300">
                            Make sure that your tool clears the surface of your
                            material without running into the limits of your
                            Z-axis. You should also use the probing feature to
                            zero your Z-axis to the centerline before surfacing.
                        </p>
                        <InputArea label="Length">
                            <ControlledInput
                                id="stockLength"
                                value={surfacingState.stockLength}
                                onChange={handleChange}
                                wrapperClassName="col-span-3"
                                className={inputStyle}
                                suffix={units}
                                type="number"
                            />
                        </InputArea>
                        <InputArea label="Start & Final Diameter">
                            <div className="grid grid-cols-[3fr_10px_3fr] gap-2 col-span-3">
                                <ControlledInput
                                    id="startHeight"
                                    value={surfacingState.startHeight}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    suffix={units}
                                    type="number"
                                />
                                <span className="flex justify-center items-center">
                                    &
                                </span>
                                <ControlledInput
                                    id="finalHeight"
                                    value={surfacingState.finalHeight}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    suffix={units}
                                    type="number"
                                />
                            </div>
                        </InputArea>
                        <InputArea label="Stepdown">
                            <ControlledInput
                                id="stepdown"
                                value={surfacingState.stepdown}
                                onChange={handleChange}
                                wrapperClassName="col-span-3"
                                className={inputStyle}
                                suffix={units}
                                type="number"
                            />
                        </InputArea>
                        <InputArea label="Bit Diameter">
                            <ControlledInput
                                id="bitDiameter"
                                value={surfacingState.bitDiameter}
                                onChange={handleChange}
                                wrapperClassName="col-span-3"
                                className={inputStyle}
                                suffix={units}
                                type="number"
                            />
                        </InputArea>
                        <InputArea label="Stepover">
                            <ControlledInput
                                id="stepover"
                                value={surfacingState.stepover}
                                onChange={handleChange}
                                wrapperClassName="col-span-3"
                                className={inputStyle}
                                suffix="%"
                                type="number"
                            />
                        </InputArea>
                        <InputArea label="Feed Rate">
                            <ControlledInput
                                id="feedrate"
                                value={surfacingState.feedrate}
                                onChange={handleChange}
                                wrapperClassName="col-span-3"
                                className={inputStyle}
                                suffix={`${units}/min`}
                                type="number"
                            />
                        </InputArea>
                        <InputArea label="Spindle RPM">
                            <ControlledInput
                                id="spindleRPM"
                                value={surfacingState.spindleRPM}
                                onChange={handleChange}
                                wrapperClassName="col-span-2"
                                className={inputStyle}
                                suffix="RPM"
                                type="number"
                            />
                            <div className="flex items-center gap-2 justify-center">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 col-span-2">
                                    Delay
                                </label>
                                <Switch
                                    checked={surfacingState.shouldDwell}
                                    onChange={(checked) =>
                                        setSurfacingState((prev) => ({
                                            ...prev,
                                            shouldDwell: checked,
                                        }))
                                    }
                                />
                            </div>
                        </InputArea>
                        <InputArea label="Enable Rehoming">
                            <div className="flex items-center gap-2 justify-center">
                                <Switch
                                    checked={surfacingState.enableRehoming}
                                    onChange={(checked) =>
                                        setSurfacingState((prev) => ({
                                            ...prev,
                                            enableRehoming: checked,
                                        }))
                                    }
                                />
                            </div> 
                            <div className="flex flex-col gap-2 w-full col-span-2 text-xs xl:text-sm text-gray-500 mt-3">
                                Cut faster and cleaner by only rotating one direction, but you will need to rehome your A-axis at the end.
                            </div>
                        </InputArea>
                    </div>
                    <div className="flex flex-col border border-gray-200 rounded-md">
                        <Tabs defaultValue="visualizer">
                            <TabsList className="w-full pb-0 border-b rounded-b-none">
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
                                    disabled={!gcode}
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
                                className={cx(
                                    'h-full rounded-md relative p-2',
                                    {
                                        invisible: !tabSwitch,
                                    },
                                )}
                            >
                                <GcodeViewer gcode={gcode} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row gap-4">
                    <Button
                        type="submit"
                        onClick={handleGenerateGcode}
                        disabled={isDisabled}
                    >
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
