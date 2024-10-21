import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import map from 'lodash/map';
import get from 'lodash/get';
import store from 'app/store';
import { connect } from 'react-redux';
import controller from 'app/lib/controller';
import { Toaster, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import { MacroVariableDropdown } from 'app/components/MacroVariableDropdown';
import ToggleSwitch from 'app/components/Switch';
import { Tooltip as TooltipCustom } from 'app/components/Tooltip';
import Input from '../components/Input';
import Fieldset from '../components/Fieldset';
import styles from '../index.module.styl';
import { Button as FunctionButton } from 'app/components/Button';

/*const options = [
    'Ignore',
    'Manual',
    'Semi-Auto',
    'Automatic'
];
*/
export const TOOLCHANGE_OPTIONS = {
    IGNORE: {
        key: 'IGNORE',
        label: 'Ignore',
        description:
            "All M6 commands will be commented out and the toolpath will continue to run as if it wasn't included.",
    },
    PAUSE: {
        key: 'PAUSE',
        label: 'Pause',
        description:
            'M6 commands will pause sending further commands but allow the user to jog, use macros, and probe.  If you move your bit, make sure it is back to the original position before resuming.',
    },
    MANUAL: {
        key: 'MANUAL',
        label: 'Standard Re-zero',
        description:
            'M6 commands will initiate a guided process through which the user will manually probe a new tool to compensate for length differences.',
    },
    SEMI: {
        key: 'SEMI',
        label: 'Flexible Re-zero',
        description:
            'M6 commands will initiate a guided process through which a saved tool offset will compensate for tool length differences.',
    },
    AUTO: {
        key: 'AUTO',
        label: 'Fixed Tool Sensor',
        description:
            'M6 will commands will initiate an almost fully automated process in which preconfigured bitsetter or probe block will be used to set the new tool length.  Limit switches required.',
    },
    CODE: {
        key: 'CODE',
        label: 'Code',
        description: 'Run code before and after the toolchange.',
    },
};

const ToolChange = ({ state, actions, mpos, $13 }) => {
    const convertToolChangePosition = () => {
        const pos = store.get('workspace.toolChangePosition');
        return {
            x: Number(pos.x) / 25.4,
            y: Number(pos.y) / 25.4,
            z: Number(pos.z) / 25.4,
        };
    };

    // State
    const [toolChangeOption, setToolChangeOption] = useState(
        store.get('workspace.toolChangeOption'),
    );
    const [toolChangePosition, setToolChangePosition] = useState(
        $13
            ? convertToolChangePosition()
            : store.get('workspace.toolChangePosition'),
    );
    const [optionDescription, setOptionDescription] = useState('');
    const [preHook, setPreHook] = useState(
        store.get('workspace.toolChangeHooks.preHook'),
    );
    const [postHook, setPostHook] = useState(
        store.get('workspace.toolChangeHooks.postHook'),
    );

    // Handlers
    const handleToolChange = (selection) => {
        setOptionDescription(TOOLCHANGE_OPTIONS[selection.value].description);
        return setToolChangeOption(selection.label);
    };
    const handlePreHookChange = (e) => setPreHook(e.target.value);
    const handlePostHookChange = (e) => setPostHook(e.target.value);
    const preHookRef = useRef();
    const postHookRef = useRef();

    const setBitsetterPosition = () => {
        const newPosition = {
            x: Number(mpos.x),
            y: Number(mpos.y),
            z: Number(mpos.z),
        };
        let newPositionMetric = { ...newPosition };
        if ($13) {
            newPositionMetric = {
                x: (Number(mpos.x) * 25.4).toFixed(3),
                y: (Number(mpos.y) * 25.4).toFixed(3),
                z: (Number(mpos.z) * 25.4).toFixed(3),
            };
        }

        store.replace('workspace.toolChangePosition', newPositionMetric);
        setToolChangePosition(newPosition);
    };

    const handlePositionChange = (value, axis) => {
        const newPosition = {
            ...toolChangePosition,
            [axis]: Number(value),
        };
        let newPositionMetric = newPosition;
        if ($13) {
            const storeToolChangePosition = store.get(
                'workspace.toolChangePosition',
            );
            newPositionMetric = {
                ...storeToolChangePosition,
                [axis]: Number(value) * 25.4,
            };
        }

        setToolChangePosition(newPosition);
        store.replace('workspace.toolChangePosition', newPositionMetric);
    };

    const handleSaveCode = () => {
        store.set('workspace.toolChangeHooks.preHook', preHook);
        store.set('workspace.toolChangeHooks.postHook', postHook);
        const context = {
            toolChangeOption,
            postHook,
            preHook,
        };
        controller.command('toolchange:context', context);
        Toaster.pop({
            msg: 'Saved tool change hooks',
            type: TOASTER_SUCCESS,
            icon: 'fa-check',
        });
    };

    useEffect(() => {
        store.set('workspace.toolChangeOption', toolChangeOption);
        const context = {
            toolChangeOption,
        };
        controller.command('toolchange:context', context);
    }, [toolChangeOption]);

    return (
        <div style={{ width: '70%' }}>
            <Fieldset legend="Tool Change" className={styles.paddingBottom}>
                <TooltipCustom
                    content="Send the toolchange line as is. This assumes that your firmware can properly handle both M6 and T commands."
                    location="default"
                >
                    <ToggleSwitch
                        label="Passthrough"
                        checked={state.toolChange.passthrough}
                        onChange={actions.toolChange.handlePassthroughToggle}
                        style={{ marginBottom: '1rem' }}
                    />
                </TooltipCustom>
                <small>Strategy to handle M6 tool change commands</small>
                <div className={styles.addMargin}>
                    <Select
                        backspaceRemoves={false}
                        className="sm"
                        clearable={false}
                        menuContainerStyle={{ zIndex: 5 }}
                        name="toolchangeoption"
                        onChange={handleToolChange}
                        options={map(TOOLCHANGE_OPTIONS, (option) => ({
                            value: option.key,
                            label: option.label,
                        }))}
                        value={{ label: toolChangeOption }}
                    />
                    <p className={styles.description}>{optionDescription}</p>
                </div>
                {toolChangeOption === 'Fixed Tool Sensor' && (
                    <div>
                        <Input
                            label="Sensor X position"
                            units=""
                            value={toolChangePosition.x}
                            onChange={(e) =>
                                handlePositionChange(e.target.value, 'x')
                            }
                        />
                        <Input
                            label="Sensor Y position"
                            units=""
                            value={toolChangePosition.y}
                            onChange={(e) =>
                                handlePositionChange(e.target.value, 'y')
                            }
                        />
                        <Input
                            label="Sensor Z position"
                            units=""
                            value={toolChangePosition.z}
                            onChange={(e) =>
                                handlePositionChange(e.target.value, 'z')
                            }
                        />
                        <div>
                            <FunctionButton
                                primary
                                onClick={setBitsetterPosition}
                            >
                                Grab Current Position
                            </FunctionButton>
                            <p className={styles.description}>
                                Set fixed tool sensor position at current
                                machine position - this will be the start
                                location for probing. Your Z value should be
                                negative.
                            </p>
                        </div>
                    </div>
                )}
                {toolChangeOption === 'Code' && (
                    <div>
                        <div className={styles.spreadRow}>
                            <MacroVariableDropdown
                                textarea={preHookRef}
                                label="Before change code"
                            />
                        </div>
                        <textarea
                            rows="7"
                            className="form-control"
                            style={{ resize: 'none' }}
                            name="preHook"
                            value={preHook}
                            onChange={handlePreHookChange}
                            ref={preHookRef}
                        />
                        <div
                            className={styles.spreadRow}
                            style={{ marginTop: '10px' }}
                        >
                            <MacroVariableDropdown
                                textarea={postHookRef}
                                label="After change code"
                            />
                        </div>
                        <textarea
                            rows="7"
                            className="form-control"
                            style={{ resize: 'none' }}
                            name="postHook"
                            value={postHook}
                            onChange={handlePostHookChange}
                            ref={postHookRef}
                        />
                        <FunctionButton primary onClick={handleSaveCode}>
                            Save G-Code
                        </FunctionButton>
                    </div>
                )}
            </Fieldset>
        </div>
    );
};

export default connect((store) => {
    const mpos = get(store, 'controller.state.status.mpos', {
        x: 0,
        y: 0,
        z: 0,
    });
    const $13 = Number(get(store, 'controller.settings.settings.$13', 0));
    return { mpos, $13 };
})(ToolChange);
