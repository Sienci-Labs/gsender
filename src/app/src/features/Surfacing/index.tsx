import { useState } from 'react';

import { Input } from 'app/components/shadcn/Input';
import defaultState from 'app/store/defaultState';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from 'app/components/shadcn/Tabs';

import get from 'lodash/get';

import Generator from './utils/surfacingGcodeGenerator';
import { GcodeViewer } from './components/GcodeViewer';
import store from 'app/store';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    IMPERIAL_UNITS,
} from 'app/constants';
import { Surfacing } from './definitions';
import { convertToMetric } from 'app/lib/units';
import MultiInputBlock from 'app/components/MultiInputBlock';
import cx from 'classnames';
import { Checkbox } from 'app/components/shadcn/Checkbox';
import MachinePosition from './components/MachinePosition';
import { getWidgetConfigContext } from '../WidgetConfig/WidgetContextProvider';
import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { FaCode, FaPlay } from 'react-icons/fa';

const defaultSurfacingState = get(defaultState, 'widgets.surfacing', {});

const SurfacingTool = () => {
    const status = useTypedSelector((state) => state?.controller.state?.status);
    console.log(status?.activeState);
    const isDisabled =
        status?.activeState !== GRBL_ACTIVE_STATE_IDLE &&
        status?.activeState !== GRBL_ACTIVE_STATE_JOG;
    console.log(isDisabled);
    const { actions: config } = getWidgetConfigContext();

    const [surfacing, setSurfacing]: [
        Surfacing,
        React.Dispatch<Partial<Surfacing>>,
    ] = useState(config.get('', defaultSurfacingState));
    const [gcode, setGcode] = useState('');

    const units = store.get('workspace.units');
    const inputStyle =
        'text-xl font-light z-0 align-center text-center text-blue-500 pl-1 pr-1 w-full';

    const handleGenerateGcode = () => {
        const generator = new Generator({
            surfacing: surfacing,
            units: units,
        });
        setGcode(generator.generate());

        saveSurfacing(surfacing, units === IMPERIAL_UNITS);
    };

    const onChange = (property: string, value: number) => {
        console.log(value);
        setSurfacing({
            ...surfacing,
            [property]: value,
        });
    };

    const saveSurfacing = (surfacing: Surfacing, needsConvert = false) => {
        if (needsConvert) {
            config.set('surfacing', {
                ...surfacing,
                bitDiameter: convertToMetric(surfacing.bitDiameter),
                stepover: convertToMetric(surfacing.stepover),
                feedrate: convertToMetric(surfacing.feedrate),
                length: convertToMetric(surfacing.length),
                width: convertToMetric(surfacing.width),
                skimDepth: convertToMetric(surfacing.skimDepth),
                maxDepth: convertToMetric(surfacing.maxDepth),
            });
        } else {
            config.set('surfacing', surfacing);
        }
    };

    const loadGcode = () => {
        const name = 'gSender_Surfacing';
        const { size } = new File([gcode], name);

        // pubsub.publish('gcode:surfacing', { gcode, name, size });
        // onClose();
    };

    return (
        <div>
            <div className="flex items-center mb-0 border-solid border-gray-400 h-16">
                <h3 className="m-0 ml-4">Surfacing Tool</h3>
            </div>

            <div className="py-2 px-4 bg-gray-200 grid grid-rows-[5fr_1fr] h-full gap-y-4">
                <div className="grid grid-cols-[3fr_4fr] gap-8">
                    <div>
                        <p className="text-base font-normal mb-4 text-gray-500">
                            <b>For ideal wasteboard surfacing:</b> know your
                            CNCs exact movement limits accounting for limit
                            switches and other add-ons, get nicer and faster
                            cuts using your widest diameter bit, and consider
                            turning off hard and soft limits so you don&apos;t
                            encounter alarms or errors.
                        </p>
                        <div className="flex justify-between">
                            <MultiInputBlock
                                label="X & Y"
                                divider="&"
                                firstComponent={
                                    <Input
                                        type="number"
                                        id="width"
                                        min={1}
                                        max={50000}
                                        className={inputStyle}
                                        value={surfacing.width}
                                        onChange={(e) =>
                                            onChange(
                                                'width',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                }
                                secondComponent={
                                    <Input
                                        type="number"
                                        id="length"
                                        units={units}
                                        min={1}
                                        max={50000}
                                        className={inputStyle}
                                        value={surfacing.length}
                                        onChange={(e) =>
                                            onChange(
                                                'length',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                }
                            />
                        </div>
                        <div className="flex items-center">
                            <MultiInputBlock
                                label="Cut Depth & Max"
                                divider="&"
                                firstComponent={
                                    <Input
                                        type="number"
                                        id="skimDepth"
                                        min={0.00001}
                                        max={10000}
                                        className={cx('rounded', inputStyle)}
                                        value={surfacing.skimDepth}
                                        onChange={(e) =>
                                            onChange(
                                                'skimDepth',
                                                Number(e.target.value),
                                            )
                                        }
                                        // tooltip={{
                                        //     content: `Default Value: ${defaultValues.skimDepth}`,
                                        // }}
                                    />
                                }
                                secondComponent={
                                    <Input
                                        type="number"
                                        id="maxDepth"
                                        units={units}
                                        min={0.00001}
                                        max={10000}
                                        className={inputStyle}
                                        // style={{ ...inputStyles }}
                                        value={surfacing.maxDepth}
                                        onChange={(e) =>
                                            onChange(
                                                'maxDepth',
                                                Number(e.target.value),
                                            )
                                        }
                                        // tooltip={{
                                        //     content: `Default Value: ${defaultValues.maxDepth}`,
                                        // }}
                                    />
                                }
                            />
                        </div>

                        <div className="flex items-center font-light mb-4">
                            <Input
                                label="Bit Diameter"
                                type="number"
                                units={units}
                                className={inputStyle}
                                value={surfacing.bitDiameter}
                                onChange={(e) =>
                                    onChange(
                                        'bitDiameter',
                                        Number(e.target.value),
                                    )
                                }
                            />
                        </div>
                        <div className="flex items-center">
                            <MultiInputBlock
                                label="Cut Depth & Max"
                                divider=""
                                firstComponent={
                                    <Input
                                        type="number"
                                        className={inputStyle}
                                        value={surfacing.spindleRPM}
                                        onChange={(e) =>
                                            onChange(
                                                'spindleRPM',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                }
                                secondComponent={
                                    <div className="flex items-center gap-2 justify-center">
                                        <span className="text-lg font-light">
                                            Delay
                                        </span>
                                        <Checkbox
                                            checked={surfacing.shouldDwell}
                                            onCheckedChange={(checked) => {
                                                setSurfacing({
                                                    ...surfacing,
                                                    shouldDwell:
                                                        checked as boolean,
                                                });
                                            }}
                                            className="bg-white border-gray-400 rounded-sm min-h-5 min-w-5"
                                        />
                                    </div>
                                }
                            />
                        </div>
                        <div className="flex items-center font-light mb-4">
                            <Input
                                label="Feedrate"
                                type="number"
                                units={`${units}/min`}
                                className={inputStyle}
                                value={surfacing.feedrate}
                                onChange={(e) =>
                                    onChange('feedrate', Number(e.target.value))
                                }
                            />
                        </div>
                        <div className="flex items-center font-light mb-4">
                            <Input
                                label="Stepover"
                                type="number"
                                units="%"
                                className={inputStyle}
                                value={surfacing.stepover}
                                onChange={(e) =>
                                    onChange('stepover', Number(e.target.value))
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-lg font-light">
                                Start Position
                            </span>

                            <MachinePosition
                                surfacing={surfacing}
                                setSurfacing={setSurfacing}
                            />
                        </div>
                    </div>
                    <Tabs defaultValue="gcode-viewer">
                        <TabsList>
                            <TabsTrigger
                                value="gcode-viewer"
                                className="text-blue-500"
                            >
                                G-code Viewer
                            </TabsTrigger>
                            <TabsTrigger
                                value="visualizer-preview"
                                className="text-blue-500"
                            >
                                Visualizer Preview
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent
                            value="gcode-viewer"
                            className="p-4 h-[600px] border border-gray-500 rounded relative"
                        >
                            <GcodeViewer gcode={gcode} />
                        </TabsContent>
                        <TabsContent
                            value="visualizer-preview"
                            className="h-[600px] border border-gray-500 rounded"
                        >
                            {/* Add visualization here */}
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="grid grid-cols-2 gap-x-4 w-4/5 m-auto">
                    <ToolModalButton
                        Icon={FaCode}
                        disabled={isDisabled}
                        className="m-0"
                        onClick={handleGenerateGcode}
                    >
                        Generate G-code
                    </ToolModalButton>
                    <ToolModalButton
                        Icon={FaPlay}
                        disabled={!!!gcode && isDisabled}
                        className="m-0"
                        onClick={loadGcode}
                    >
                        Run on Main Visualizer
                    </ToolModalButton>
                </div>
            </div>
        </div>
    );
};

export default SurfacingTool;
