/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <> */
import { Button } from 'app/components/Button';
import { ControlledInput } from 'app/components/ControlledInput';
import { Switch } from 'app/components/shadcn/Switch';
import { Tabs, TabsList, TabsTrigger } from 'app/components/shadcn/Tabs';
import { Tooltip } from 'app/components/Tooltip';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    IMPERIAL_UNITS,
    TOOLBAR_CATEGORY,
    VISUALIZER_PRIMARY,
    VISUALIZER_SECONDARY,
} from 'app/constants';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { useAppTranslation } from 'app/i18n';
import controller from 'app/lib/controller';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';
import { convertToImperial, convertToMetric } from 'app/lib/units';
import useKeybinding from 'app/lib/useKeybinding';
import store from 'app/store';
import cx from 'classnames';
import { useEffect, useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router';
import { GcodeViewer } from '../Surfacing/components/GcodeViewer';
import InputArea from './components/InputArea';
import VisualizerPreview from './components/VisualizerPreview';
import { DEFAULT_VALUES_MM } from './constants';
import type { RotarySurfacingOptions } from './definitions';
import { StockTurningGenerator } from './utils/Generator';

type RotarySurfacingProps = {
    /** Pendant override: see VisualizerPreview's PreviewComponent prop. */
    PreviewComponent?: ComponentType<{ gcode?: string }>;
};

const RotarySurfacing = ({ PreviewComponent }: RotarySurfacingProps = {}) => {
    const { t } = useAppTranslation();
    const navigate = useNavigate();
    const { units } = useWorkspaceState();
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
            toolNumber: +surfacingState.toolNumber,
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

    useShuttleEvents(shuttleControlEvents);
    useEffect(() => {
        // biome-ignore lint/correctness/useHookAtTopLevel: <>
        useKeybinding(shuttleControlEvents);
    }, []);

    const inputStyle =
        'text-xl font-light z-0 align-center text-center text-blue-600 dark:text-blue-400 pl-1 pr-1 w-full';

    const defaultValue =
        units === 'mm'
            ? DEFAULT_VALUES_MM
            : {
                  ...DEFAULT_VALUES_MM,
                  stockLength: convertToImperial(DEFAULT_VALUES_MM.stockLength),
                  startHeight: convertToImperial(DEFAULT_VALUES_MM.startHeight),
                  finalHeight: convertToImperial(DEFAULT_VALUES_MM.finalHeight),
                  stepdown: convertToImperial(DEFAULT_VALUES_MM.stepdown),
                  bitDiameter: convertToImperial(DEFAULT_VALUES_MM.bitDiameter),
                  feedrate: convertToImperial(DEFAULT_VALUES_MM.feedrate),
              };

    const status = useTypedSelector((state) => state?.controller.state?.status);
    const isDisabled =
        status &&
        status.activeState !== GRBL_ACTIVE_STATE_IDLE &&
        status.activeState !== GRBL_ACTIVE_STATE_JOG;

    return (
        <div>
            <div className="bg-white dark:bg-transparent dark:text-content-primary w-full flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-4 xl:gap-2">
                        <p className="text-sm xl:text-base font-normal text-gray-600 dark:text-content-secondary">
                            {t('tools:rotary.surfacing.intro')}
                        </p>
                        <InputArea label={t('tools:rotary.surfacing.length')}>
                            <Tooltip
                                content={t('tools:common.defaultValueUnits', {
                                    value: defaultValue.stockLength,
                                    units,
                                })}
                            >
                                <ControlledInput
                                    id="stockLength"
                                    value={surfacingState.stockLength}
                                    onChange={handleChange}
                                    wrapperClassName="col-span-3"
                                    className={inputStyle}
                                    suffix={units}
                                    type="number"
                                    immediateOnChange
                                />
                            </Tooltip>
                        </InputArea>

                        <InputArea
                            label={t(
                                'tools:rotary.surfacing.startFinalDiameter',
                            )}
                        >
                            <div className="grid grid-cols-[3fr_10px_3fr] gap-2 col-span-3">
                                <Tooltip
                                    content={t(
                                        'tools:common.defaultValueUnits',
                                        {
                                            value: defaultValue.startHeight,
                                            units,
                                        },
                                    )}
                                >
                                    <ControlledInput
                                        id="startHeight"
                                        value={surfacingState.startHeight}
                                        onChange={handleChange}
                                        className={inputStyle}
                                        suffix={units}
                                        type="number"
                                        immediateOnChange
                                    />
                                </Tooltip>
                                <span className="flex justify-center items-center">
                                    &
                                </span>
                                <Tooltip
                                    content={t(
                                        'tools:common.defaultValueUnits',
                                        {
                                            value: defaultValue.finalHeight,
                                            units,
                                        },
                                    )}
                                >
                                    <ControlledInput
                                        id="finalHeight"
                                        value={surfacingState.finalHeight}
                                        onChange={handleChange}
                                        className={inputStyle}
                                        suffix={units}
                                        type="number"
                                        immediateOnChange
                                    />
                                </Tooltip>
                            </div>
                        </InputArea>
                        <InputArea label={t('tools:rotary.surfacing.stepdown')}>
                            <Tooltip
                                content={t('tools:common.defaultValueUnits', {
                                    value: defaultValue.stepdown,
                                    units,
                                })}
                            >
                                <ControlledInput
                                    id="stepdown"
                                    value={surfacingState.stepdown}
                                    onChange={handleChange}
                                    wrapperClassName="col-span-3"
                                    className={inputStyle}
                                    suffix={units}
                                    type="number"
                                    immediateOnChange
                                />
                            </Tooltip>
                        </InputArea>
                        <InputArea
                            label={t(
                                'tools:rotary.surfacing.bitDiameterAndTool',
                            )}
                        >
                            <div className="grid grid-cols-[3fr_10px_3fr] gap-2 col-span-3">
                                <Tooltip
                                    content={t(
                                        'tools:common.defaultValueUnits',
                                        {
                                            value: defaultValue.bitDiameter,
                                            units,
                                        },
                                    )}
                                >
                                    <ControlledInput
                                        id="bitDiameter"
                                        value={surfacingState.bitDiameter}
                                        onChange={handleChange}
                                        className={inputStyle}
                                        suffix={units}
                                        type="number"
                                        immediateOnChange
                                    />
                                </Tooltip>
                                <span className="flex justify-center items-center">
                                    &
                                </span>
                                <Tooltip
                                    content={t('tools:common.defaultValue', {
                                        value: defaultValue.toolNumber,
                                    })}
                                >
                                    <ControlledInput
                                        id="toolNumber"
                                        value={surfacingState.toolNumber}
                                        onChange={handleChange}
                                        className={`${inputStyle} md:text-xl`}
                                        min={0}
                                        type="number"
                                        immediateOnChange
                                    />
                                </Tooltip>
                            </div>
                        </InputArea>
                        <InputArea label={t('tools:common.stepover')}>
                            <Tooltip
                                content={t('tools:common.defaultValue', {
                                    value: `${defaultValue.stepover}%`,
                                })}
                            >
                                <ControlledInput
                                    id="stepover"
                                    value={surfacingState.stepover}
                                    onChange={handleChange}
                                    wrapperClassName="col-span-3"
                                    className={inputStyle}
                                    suffix="%"
                                    type="number"
                                    immediateOnChange
                                />
                            </Tooltip>
                        </InputArea>
                        <InputArea label={t('tools:common.feedRate')}>
                            <Tooltip
                                content={t('tools:common.defaultValueUnits', {
                                    value: defaultValue.feedrate,
                                    units: `${units}/min`,
                                })}
                            >
                                <ControlledInput
                                    id="feedrate"
                                    value={surfacingState.feedrate}
                                    onChange={handleChange}
                                    wrapperClassName="col-span-3"
                                    className={inputStyle}
                                    suffix={`${units}/min`}
                                    type="number"
                                />
                            </Tooltip>
                        </InputArea>
                        <InputArea label={t('tools:common.spindleRpm')}>
                            <Tooltip
                                content={t('tools:common.defaultValueUnits', {
                                    value: defaultValue.spindleRPM,
                                    units: 'RPM',
                                })}
                            >
                                <ControlledInput
                                    id="spindleRPM"
                                    value={surfacingState.spindleRPM}
                                    onChange={handleChange}
                                    wrapperClassName="col-span-2"
                                    className={inputStyle}
                                    suffix="RPM"
                                    type="number"
                                    immediateOnChange
                                />
                            </Tooltip>

                            <Tooltip
                                content={
                                    defaultValue.shouldDwell
                                        ? t('tools:common.defaultOn')
                                        : t('tools:common.defaultOff')
                                }
                            >
                                <div className="flex items-center gap-2 justify-center">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 col-span-2">
                                        {t('tools:common.delay')}
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
                            </Tooltip>
                        </InputArea>

                        <InputArea
                            label={t('tools:rotary.surfacing.enableRehoming')}
                        >
                            <Tooltip
                                content={
                                    defaultValue.enableRehoming
                                        ? t('tools:common.defaultOn')
                                        : t('tools:common.defaultOff')
                                }
                            >
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
                            </Tooltip>
                            <div className="flex flex-col gap-2 w-full col-span-2 text-xs xl:text-sm text-gray-600">
                                {t('tools:rotary.surfacing.rehomingHint')}
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
                                    {t('tools:common.visualizerPreview')}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="gcode"
                                    className="w-full"
                                    onClick={() => setTabSwitch(true)}
                                    disabled={!gcode}
                                >
                                    {t('tools:common.gcodeTab')}{' '}
                                    {gcode.length !== 0 ? (
                                        <span className="text-xs text-gray-600">
                                            {t('tools:common.lineCount', {
                                                count: gcode.split('\n').length,
                                            })}
                                        </span>
                                    ) : null}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="relative w-full h-full">
                            <div
                                className={cx(
                                    'absolute w-full h-full top-0 left-0 rounded-md',
                                    {
                                        invisible: tabSwitch,
                                    },
                                )}
                            >
                                <VisualizerPreview
                                    gcode={gcode}
                                    PreviewComponent={PreviewComponent}
                                />
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
                        {t('tools:common.generateGcode')}
                    </Button>
                    <Button
                        onClick={handleLoadToMainVisualizer}
                        disabled={!gcode || isDisabled}
                    >
                        {t('tools:common.loadToMainVisualizer')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RotarySurfacing;
