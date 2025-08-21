import { useEffect, useState } from 'react';
import get from 'lodash/get';
import pubsub from 'pubsub-js';
import { useNavigate } from 'react-router';

import store from 'app/store';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    IMPERIAL_UNITS,
    METRIC_UNITS,
    VISUALIZER_SECONDARY,
} from 'app/constants';
import { convertToImperial, convertToMetric } from 'app/lib/units';
import cx from 'classnames';
import { Switch } from 'app/components/shadcn/Switch';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { ControlledInput } from 'app/components/ControlledInput';
import defaultState from 'app/store/defaultState';
import { Tabs, TabsList, TabsTrigger } from 'app/components/shadcn/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'app/components/shadcn/Select';

import { Jointer } from './definitions';
import WidgetConfig from '../WidgetConfig/WidgetConfig';
import JointerGenerator from './utils/jointerGcodeGenerator';
import { GcodeViewer } from './components/GcodeViewer';
import controller from 'app/lib/controller';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';
import InputArea from 'app/components/InputArea';
import { Button } from 'app/components/Button';
import VisualizerPreview from './components/VisualizerPreview';

const defaultJointerState = get(defaultState, 'widgets.jointer', {
    bitDiameter: 6.35,
    feedrate: 1000,
    length: 100,
    orientation: 'X' as 'X' | 'Y',
    depthOfCut: 1,
    totalDepth: 3,
    thickness: 20,
    numberOfPasses: 3,
    spindleRPM: 18000,
    shouldDwell: false,
    mist: false,
    flood: false,
});

const JointerTool = () => {
    const navigate = useNavigate();
    const jointerConfig = new WidgetConfig('jointer');
    const [tabSwitch, setTabSwitch] = useState(false);
    const units = store.get('workspace.units', METRIC_UNITS);

    const status = useTypedSelector((state) => state?.controller.state?.status);
    const isDisabled =
        status &&
        status.activeState !== GRBL_ACTIVE_STATE_IDLE &&
        status.activeState !== GRBL_ACTIVE_STATE_JOG;

    // Initialize state with appropriate units
    const getInitialState = (): Jointer => {
        const jointer = jointerConfig.get('', defaultJointerState);

        if (units === IMPERIAL_UNITS) {
            return {
                ...jointer,
                bitDiameter: convertToImperial(jointer.bitDiameter),
                feedrate: convertToImperial(jointer.feedrate),
                length: convertToImperial(jointer.length),
                depthOfCut: convertToImperial(jointer.depthOfCut),
                totalDepth: convertToImperial(jointer.totalDepth),
                thickness: convertToImperial(jointer.thickness),
            };
        }
        return jointer;
    };

    const [jointer, setJointer] = useState<Jointer>(getInitialState());
    const [gcode, setGcode] = useState('');

    useEffect(() => {
        const saveState = () => {
            if (units === IMPERIAL_UNITS) {
                jointerConfig.set('', {
                    ...jointer,
                    bitDiameter: convertToMetric(jointer.bitDiameter),
                    feedrate: convertToMetric(jointer.feedrate),
                    length: convertToMetric(jointer.length),
                    depthOfCut: convertToMetric(jointer.depthOfCut),
                    totalDepth: convertToMetric(jointer.totalDepth),
                    thickness: convertToMetric(jointer.thickness),
                });
            } else {
                jointerConfig.set('', jointer);
            }
        };

        return saveState();
    }, [jointer]);

    const inputStyle =
        'text-xl font-light z-0 align-center text-center text-blue-500 pl-1 pr-1 w-full';

    const handleGenerateGcode = async () => {
        const generator = new JointerGenerator({
            jointer: jointer,
            units: units,
        });

        const gcode = generator.generate();
        setGcode(gcode);

        const name = 'gSender_Jointer';
        const file = new File([gcode], name);

        uploadGcodeFileToServer(file, controller.port, VISUALIZER_SECONDARY);
    };

    const onChange = (property: string, value: number | string) => {
        setJointer({
            ...jointer,
            [property]: value,
        });
    };

    const loadGcode = () => {
        const name = 'gSender_Jointer.gcode';
        const { size } = new File([gcode], name);

        pubsub.publish('gcode:jointer', { gcode, name, size });

        navigate('/');
    };

    return (
        <>
            <div className="bg-white dark:bg-transparent dark:text-white w-full flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-4 xl:gap-2">
                        <p className="text-sm xl:text-base font-normal text-gray-500 dark:text-gray-300">
                            <b>Jointer Tool:</b> Create perfect perpendicular edges on your material. 
                            Set the length, orientation (X or Y axis), depth parameters, and number of passes 
                            to generate precise jointing toolpaths.
                        </p>

                        <InputArea label="Edge Length">
                            <ControlledInput
                                type="number"
                                suffix={units}
                                className={inputStyle}
                                value={jointer.length}
                                wrapperClassName="col-span-3"
                                onChange={(e) =>
                                    onChange('length', Number(e.target.value))
                                }
                            />
                        </InputArea>

                        <InputArea label="Orientation">
                            <div className="col-span-3">
                                <Select
                                    value={jointer.orientation}
                                    onValueChange={(value) => onChange('orientation', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select orientation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="X">X-Axis (Edge parallel to X)</SelectItem>
                                        <SelectItem value="Y">Y-Axis (Edge parallel to Y)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </InputArea>

                        <InputArea label="Depth of Cut">
                            <ControlledInput
                                type="number"
                                suffix={units}
                                className={inputStyle}
                                value={jointer.depthOfCut}
                                wrapperClassName="col-span-3"
                                onChange={(e) =>
                                    onChange('depthOfCut', Number(e.target.value))
                                }
                            />
                        </InputArea>

                        <InputArea label="Total Depth">
                            <ControlledInput
                                type="number"
                                suffix={units}
                                className={inputStyle}
                                value={jointer.totalDepth}
                                wrapperClassName="col-span-3"
                                onChange={(e) =>
                                    onChange('totalDepth', Number(e.target.value))
                                }
                            />
                        </InputArea>

                        <InputArea label="Material Thickness">
                            <ControlledInput
                                type="number"
                                suffix={units}
                                className={inputStyle}
                                value={jointer.thickness}
                                wrapperClassName="col-span-3"
                                onChange={(e) =>
                                    onChange('thickness', Number(e.target.value))
                                }
                            />
                        </InputArea>

                        <InputArea label="Number of Passes">
                            <ControlledInput
                                type="number"
                                className={inputStyle}
                                value={jointer.numberOfPasses}
                                min={1}
                                max={20}
                                wrapperClassName="col-span-3"
                                onChange={(e) =>
                                    onChange('numberOfPasses', Number(e.target.value))
                                }
                            />
                        </InputArea>

                        <InputArea label="Bit Diameter">
                            <ControlledInput
                                type="number"
                                suffix={units}
                                className={inputStyle}
                                value={jointer.bitDiameter}
                                wrapperClassName="col-span-3"
                                onChange={(e) =>
                                    onChange('bitDiameter', Number(e.target.value))
                                }
                            />
                        </InputArea>

                        <InputArea label="Feed Rate">
                            <ControlledInput
                                type="number"
                                suffix={`${units}/min`}
                                className={inputStyle}
                                value={jointer.feedrate}
                                wrapperClassName="col-span-3"
                                onChange={(e) =>
                                    onChange('feedrate', Number(e.target.value))
                                }
                            />
                        </InputArea>

                        <InputArea label="Spindle RPM">
                            <div className="grid grid-cols-2 gap-2 col-span-3">
                                <ControlledInput
                                    type="number"
                                    className={inputStyle}
                                    value={jointer.spindleRPM}
                                    suffix={'RPM'}
                                    onChange={(e) =>
                                        onChange('spindleRPM', Number(e.target.value))
                                    }
                                />
                                <div className="flex items-center gap-2 justify-center">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 col-span-2">
                                        Delay
                                    </label>
                                    <Switch
                                        checked={jointer.shouldDwell}
                                        onChange={(checked) => {
                                            setJointer({
                                                ...jointer,
                                                shouldDwell: checked as boolean,
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        </InputArea>

                        <InputArea label="Coolant Control">
                            <div className="grid grid-cols-2 gap-2 col-span-3">
                                <span className="font-light text-sm max-w-20 dark:text-white">
                                    Mist (M7)
                                </span>
                                <Switch
                                    onChange={(value) =>
                                        setJointer({
                                            ...jointer,
                                            mist: value,
                                        })
                                    }
                                    checked={jointer.mist ?? false}
                                    className="h-20"
                                />
                                <span className="font-light text-sm max-w-20 dark:text-white">
                                    Flood (M8)
                                </span>
                                <Switch
                                    onChange={(value) =>
                                        setJointer({
                                            ...jointer,
                                            flood: value,
                                        })
                                    }
                                    checked={jointer.flood ?? false}
                                    className="h-20"
                                />
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

export default JointerTool;