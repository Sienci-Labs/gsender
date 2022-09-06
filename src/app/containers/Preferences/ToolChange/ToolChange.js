import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import map from 'lodash/map';

import { TOASTER_SUCCESS, Toaster } from 'app/lib/toaster/ToasterLib';
import store from 'app/store';
import controller from 'app/lib/controller';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';
import MacroVariableDropdown from 'app/components/MacroVariableDropdown';

import Fieldset from '../components/Fieldset';

import styles from '../index.styl';

/*const options = [
    'Ignore',
    'Manual',
    'Semi-Auto',
    'Automatic'
];
*/
export const TOOLCHANGE_OPTIONS = {
    IGNORE: {
        label: 'Ignore'
    },
    MANUAL: {
        label: 'Manual'
    },
    SEMI: {
        label: 'Semi-Automatic'
    },
    AUTO: {
        label: 'Automatic'
    }
};

const ToolChange = () => {
    // State
    const [toolChangeOption, setToolChangeOption] = useState(store.get('workspace.toolChangeOption'));
    const [preHook, setPreHook] = useState(store.get('workspace.toolChangeHooks.preHook'));
    const [postHook, setPostHook] = useState(store.get('workspace.toolChangeHooks.postHook'));
    // Handlers
    const handleToolChange = (selection) => setToolChangeOption(selection.value);
    const handlePreHookChange = (e) => setPreHook(e.target.value);
    const handlePostHookChange = (e) => setPostHook(e.target.value);
    const preHookRef = useRef();
    const postHookRef = useRef();
    const handleSaveCode = () => {
        store.set('workspace.toolChangeHooks.preHook', preHook);
        store.set('workspace.toolChangeHooks.postHook', postHook);
        const context = {
            toolChangeOption,
            postHook,
            preHook
        };
        controller.command('toolchange:context', context);
        Toaster.pop({
            msg: 'Saved tool change hooks',
            type: TOASTER_SUCCESS,
            icon: 'fa-check'
        });
    };

    useEffect(() => {
        store.set('workspace.toolChangeOption', toolChangeOption);
        const context = {
            toolChangeOption,
            postHook,
            preHook
        };
        controller.command('toolchange:context', context);
    }, [toolChangeOption]);

    return (
        <Fieldset legend="Tool Change" className={styles.paddingBottom}>
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
                        value: option.label,
                        label: option.label
                    }))}
                    value={{ label: toolChangeOption }}
                />
            </div>
            {
                toolChangeOption === 'Code' && (
                    <div>
                        <div className={styles.spreadRow}>
                            <MacroVariableDropdown textarea={preHookRef} label="Before change code"/>
                        </div>
                        <textarea
                            rows="9"
                            className="form-control"
                            style={{ resize: 'none' }}
                            name="preHook"
                            value={preHook}
                            onChange={handlePreHookChange}
                            ref={preHookRef}
                        />
                        <br />
                        <div className={styles.spreadRow}>
                            <MacroVariableDropdown textarea={postHookRef} label="After change code"/>
                        </div>
                        <textarea
                            rows="9"
                            className="form-control"
                            style={{ resize: 'none' }}
                            name="postHook"
                            value={postHook}
                            onChange={handlePostHookChange}
                            ref={postHookRef}
                        />
                        <FunctionButton primary onClick={handleSaveCode}>Save G-Code</FunctionButton>
                    </div>
                )
            }
        </Fieldset>
    );
};

export default ToolChange;
