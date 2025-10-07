import { useEffect, useState } from 'react';
import get from 'lodash/get';
import pubsub from 'pubsub-js';
import { useNavigate } from 'react-router';
import cx from 'classnames';

import store from 'app/store';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    IMPERIAL_UNITS,
    METRIC_UNITS,
    VISUALIZER_SECONDARY,
} from 'app/constants';
import { convertToImperial, convertToMetric } from 'app/lib/units';
import { Switch } from 'app/components/shadcn/Switch';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { ControlledInput } from 'app/components/ControlledInput';
import defaultState from 'app/store/defaultState';
import { Tabs, TabsList, TabsTrigger } from 'app/components/shadcn/Tabs';
import controller from 'app/lib/controller';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';
import InputArea from 'app/components/InputArea';
import { Button } from 'app/components/Button';
import VisualizerPreview from './components/VisualizerPreview';
import Tooltip from 'app/components/Tooltip';

import { Surfacing } from './definitions';
import MachinePosition from './components/MachinePosition';
import WidgetConfig from '../WidgetConfig/WidgetConfig';
import Generator from './utils/surfacingGcodeGenerator';
import { GcodeViewer } from './components/GcodeViewer';

const defaultSurfacingState = get(
    defaultState,
    'widgets.surfacing',
    {},
) as Surfacing;

const SurfacingTool = () => {
    const navigate = useNavigate();
    const surfacingConfig = new WidgetConfig('surfacing');
    const [tabSwitch, setTabSwitch] = useState(false);
    const units = store.get('workspace.units', METRIC_UNITS);

    const status = useTypedSelector((state) => state?.controller.state?.status);
    const isDisabled =
        status &&
        status.activeState !== GRBL_ACTIVE_STATE_IDLE &&
        status.activeState !== GRBL_ACTIVE_STATE_JOG;

    // Initialize state with appropriate units
    const getInitialState = (): Surfacing => {
        const surfacing = surfacingConfig.get('', defaultSurfacingState.width);

        if (units === IMPERIAL_UNITS) {
            return {
                ...surfacing,
                bitDiameter: convertToImperial(surfacing.bitDiameter),
                feedrate: convertToImperial(surfacing.feedrate),
                length: convertToImperial(surfacing.length),
                width: convertToImperial(surfacing.width),
                skimDepth: convertToImperial(surfacing.skimDepth),
                maxDepth: convertToImperial(surfacing.maxDepth),
            };
        }
        return surfacing;
    };

    const [surfacing, setSurfacing] = useState<Surfacing>(getInitialState());
    const [gcode, setGcode] = useState('');

    useEffect(() => {
        const saveState = () => {
            if (units === IMPERIAL_UNITS) {
                surfacingConfig.set('', {
                    ...surfacing,
                    bitDiameter: convertToMetric(surfacing.bitDiameter),
                    feedrate: convertToMetric(surfacing.feedrate),
                    length: convertToMetric(surfacing.length),
                    width: convertToMetric(surfacing.width),
                    skimDepth: convertToMetric(surfacing.skimDepth),
                    maxDepth: convertToMetric(surfacing.maxDepth),
                });
            } else {
                surfacingConfig.set('', surfacing);
            }
        };

        return saveState();
    }, [surfacing]);

    const handleGenerateGcode = async () => {
        const generator = new Generator({ surfacing, units });

        const gcode = generator.generate();
        setGcode(gcode);

        const name = 'gSender_Surfacing';
        const file = new File([gcode], name);

        uploadGcodeFileToServer(file, controller.port, VISUALIZER_SECONDARY);
    };

    const onChange = (property: string, value: number) => {
        setSurfacing({
            ...surfacing,
            [property]: value,
        });
    };

    const loadGcode = () => {
        const name = 'gSender_Surfacing.gcode';
        const { size } = new File([gcode], name);

        pubsub.publish('gcode:surfacing', { gcode, name, size });

        navigate('/');
    };

    const inputStyle =
        'text-xl font-light z-0 align-center text-center text-blue-500 pl-1 pr-1 w-full';

    const convertedDefaultSurfacingState =
        units === 'mm'
            ? defaultSurfacingState
            : {
                  ...defaultSurfacingState,
                  bitDiameter: convertToImperial(
                      defaultSurfacingState.bitDiameter,
                  ),
                  feedrate: convertToImperial(defaultSurfacingState.feedrate),
                  length: convertToImperial(defaultSurfacingState.length),
                  width: convertToImperial(defaultSurfacingState.width),
                  skimDepth: convertToImperial(defaultSurfacingState.skimDepth),
                  maxDepth: convertToImperial(defaultSurfacingState.maxDepth),
              };

    return (
        <>
            <div className="bg-white dark:bg-transparent dark:text-white w-full flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-4 xl:gap-2">
                        <p className="text-sm xl:text-base font-normal text-gray-500 dark:text-gray-300">
                            <b>For ideal wasteboard surfacing:</b> know your
                            CNCs exact movement limits accounting for limit
                            switches and other add-ons, get nicer and faster
                            cuts using your widest diameter bit, and consider
                            turning off hard and soft limits so you don&apos;t
                            encounter alarms or errors.
                        </p>
                        <div className="grid grid-cols-5 items-center gap-4">
                            <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 col-span-2">
                                Start Position
                            </span>
                            <div className="flex items-center col-span-3 justify-center">
                                <MachinePosition
                                    surfacing={surfacing}
                                    setSurfacing={setSurfacing}
                                />
                            </div>
                        </div>
                        <InputArea label="X & Y">
                            <div className="grid grid-cols-[3fr_10px_3fr] gap-2 col-span-3">
                                <Tooltip
                                    content={`Default is ${convertedDefaultSurfacingState.width} ${units}`}
                                >
                                    <ControlledInput
                                        type="number"
                                        id="width"
                                        suffix={units}
                                        min={1}
                                        max={50000}
                                        className={inputStyle}
                                        wrapperClassName="w-full"
                                        value={surfacing.width}
                                        immediateOnChange
                                        onChange={(e) =>
                                            onChange(
                                                'width',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </Tooltip>
                                <span className="flex justify-center items-center">
                                    &
                                </span>
                                <Tooltip
                                    content={`Default is ${convertedDefaultSurfacingState.length} ${units}`}
                                >
                                    <ControlledInput
                                        type="number"
                                        id="length"
                                        suffix={units}
                                        min={1}
                                        max={50000}
                                        className={inputStyle}
                                        wrapperClassName="w-full"
                                        value={surfacing.length}
                                        immediateOnChange
                                        onChange={(e) =>
                                            onChange(
                                                'length',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </Tooltip>
                            </div>
                        </InputArea>
                        <InputArea label="Cut Depth & Max">
                            <div className="grid grid-cols-[3fr_10px_3fr] gap-2 col-span-3">
                                <Tooltip
                                    content={`Default is ${convertedDefaultSurfacingState.skimDepth} ${units}`}
                                >
                                    <ControlledInput
                                        type="number"
                                        id="skimDepth"
                                        suffix={units}
                                        min={0.00001}
                                        max={10000}
                                        className={cx('rounded', inputStyle)}
                                        wrapperClassName="w-full"
                                        value={surfacing.skimDepth}
                                        immediateOnChange
                                        onChange={(e) =>
                                            onChange(
                                                'skimDepth',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </Tooltip>
                                <span className="flex justify-center items-center">
                                    &
                                </span>
                                <Tooltip
                                    content={`Default is ${convertedDefaultSurfacingState.maxDepth} ${units}`}
                                >
                                    <ControlledInput
                                        type="number"
                                        id="maxDepth"
                                        suffix={units}
                                        min={0.00001}
                                        max={10000}
                                        className={inputStyle}
                                        wrapperClassName="w-full"
                                        value={surfacing.maxDepth}
                                        immediateOnChange
                                        onChange={(e) =>
                                            onChange(
                                                'maxDepth',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </Tooltip>
                            </div>
                        </InputArea>
                        <InputArea label="Bit Diameter">
                            <Tooltip
                                content={`Default is ${convertedDefaultSurfacingState.bitDiameter} ${units}`}
                            >
                                <ControlledInput
                                    type="number"
                                    suffix={units}
                                    className={inputStyle}
                                    value={surfacing.bitDiameter}
                                    wrapperClassName="col-span-3"
                                    immediateOnChange
                                    onChange={(e) =>
                                        onChange(
                                            'bitDiameter',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </Tooltip>
                        </InputArea>
                        <InputArea label="Stepover">
                            <Tooltip
                                content={`Default is ${convertedDefaultSurfacingState.stepover}%`}
                            >
                                <ControlledInput
                                    type="number"
                                    suffix="%"
                                    className={inputStyle}
                                    value={surfacing.stepover}
                                    wrapperClassName="col-span-3"
                                    immediateOnChange
                                    onChange={(e) =>
                                        onChange(
                                            'stepover',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </Tooltip>
                        </InputArea>
                        <InputArea label="Feed Rate">
                            <Tooltip
                                content={`Default is ${convertedDefaultSurfacingState.feedrate} ${units}/min`}
                            >
                                <ControlledInput
                                    type="number"
                                    suffix={`${units}/min`}
                                    className={inputStyle}
                                    value={surfacing.feedrate}
                                    wrapperClassName="col-span-3"
                                    immediateOnChange
                                    onChange={(e) =>
                                        onChange(
                                            'feedrate',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </Tooltip>
                        </InputArea>
                        <InputArea label="Spindle RPM">
                            <div className="grid grid-cols-2 gap-2 col-span-3">
                                <Tooltip
                                    content={`Default is ${convertedDefaultSurfacingState.spindleRPM} RPM`}
                                >
                                    <ControlledInput
                                        type="number"
                                        className={inputStyle}
                                        wrapperClassName="w-full"
                                        value={surfacing.spindleRPM}
                                        suffix={'RPM'}
                                        immediateOnChange
                                        onChange={(e) =>
                                            onChange(
                                                'spindleRPM',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </Tooltip>
                                <Tooltip
                                    content={`Default is ${convertedDefaultSurfacingState.shouldDwell ? 'on' : 'off'}`}
                                >
                                    <div className="flex items-center gap-2 justify-center">
                                        <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 col-span-2">
                                            Delay
                                        </label>
                                        <Switch
                                            checked={surfacing.shouldDwell}
                                            onChange={(checked) => {
                                                setSurfacing({
                                                    ...surfacing,
                                                    shouldDwell:
                                                        checked as boolean,
                                                });
                                            }}
                                        />
                                    </div>
                                </Tooltip>
                            </div>
                        </InputArea>
                        <InputArea label="Coolant Control">
                            <div className="flex items-center gap-2 justify-center col-span-3">
                                <Tooltip
                                    content={`Default is ${convertedDefaultSurfacingState.mist ? 'on' : 'off'}`}
                                >
                                    <div className="flex items-center gap-2 justify-center">
                                        <span className="font-light text-sm max-w-20 dark:text-white">
                                            Mist (M7)
                                        </span>
                                        <Switch
                                            onChange={(value) =>
                                                setSurfacing({
                                                    ...surfacing,
                                                    mist: value,
                                                })
                                            }
                                            checked={surfacing.mist ?? false}
                                            className="h-20"
                                        />
                                    </div>
                                </Tooltip>
                                <Tooltip
                                    content={`Default is ${convertedDefaultSurfacingState.flood ? 'on' : 'off'}`}
                                >
                                    <div className="flex items-center gap-2 justify-center">
                                        <span className="font-light text-sm max-w-20 dark:text-white">
                                            Flood (M8)
                                        </span>
                                        <Switch
                                            onChange={(value) =>
                                                setSurfacing({
                                                    ...surfacing,
                                                    flood: value,
                                                })
                                            }
                                            checked={surfacing.flood ?? false}
                                            className="h-20"
                                        />
                                    </div>
                                </Tooltip>
                            </div>
                        </InputArea>
                    </div>
                    <div className="flex flex-col border border-gray-200 rounded-md">
                        <Tabs defaultValue="visualizer-preview">
                            <TabsList className="w-full pb-0 border-b rounded-b-none">
                                <TabsTrigger
                                    value="visualizer-preview"
                                    className="w-full"
                                    onClick={() => setTabSwitch(false)}
                                >
                                    Visualizer Preview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="gcode-viewer"
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
                                className={cx('h-full relative p-2', {
                                    invisible: !tabSwitch,
                                })}
                            >
                                <GcodeViewer gcode={gcode} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-row gap-4">
                    <Button onClick={handleGenerateGcode} disabled={isDisabled}>
                        Generate G-code
                    </Button>
                    <Button
                        disabled={!!!gcode || isDisabled}
                        onClick={loadGcode}
                    >
                        Load to Main Visualizer
                    </Button>
                </div>
            </div>
        </>
    );
};

export default SurfacingTool;
