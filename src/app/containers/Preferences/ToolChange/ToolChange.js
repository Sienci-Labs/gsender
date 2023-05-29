import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import map from 'lodash/map';
import store from 'app/store';
import controller from 'app/lib/controller';
import Input from '../components/Input';


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
        key: 'IGNORE',
        label: 'Ignore',
        description: 'All M6 commands will be commented out and the toolpath will continue to run as if it wasn\'t included.'
    },
    PAUSE: {
        key: 'PAUSE',
        label: 'Pause',
        description: 'M6 commands will pause sending further commands but allow the user to jog, use macros, and probe.  If you move your bit, make sure it is back to the original position before resuming.'
    },
    MANUAL: {
        key: 'MANUAL',
        label: 'Standard Re-zero',
        description: 'M6 commands will initiate a guided process through which the user will manually probe a new tool to compensate for length differences.'
    },
    SEMI: {
        key: 'SEMI',
        label: 'Flexible Re-zero',
        description: 'M6 commands will initiate a guided process through which a saved tool offset will compensate for tool length differences.'
    },
    AUTO: {
        key: 'AUTO',
        label: 'Fixed Tool Sensor',
        description: 'M6 will commands will initiate an almost fully automated process in which preconfigured bitsetter or probe block will be used to set the new tool length.  Limit switches required.'
    }
};

const ToolChange = () => {
    // State
    const [toolChangeOption, setToolChangeOption] = useState(store.get('workspace.toolChangeOption'));
    const [toolChangePosition, setToolChangePosition] = useState(store.get('workspace.toolChangePosition'));
    const [optionDescription, setOptionDescription] = useState('');
    // Handlers
    const handleToolChange = (selection) => {
        setOptionDescription(TOOLCHANGE_OPTIONS[selection.value].description);
        return setToolChangeOption(selection.label);
    };

    const handlePositionChange = (event, axis) => {
        const value = event.target.value;
        const newPosition = {
            ...toolChangePosition,
            [axis]: Number(value)
        };
        setToolChangePosition(newPosition);
        store.replace('workspace.toolChangePosition', newPosition);
    };

    useEffect(() => {
        store.set('workspace.toolChangeOption', toolChangeOption);
        const context = {
            toolChangeOption,
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
                        value: option.key,
                        label: option.label,
                    }))}
                    value={{ label: toolChangeOption }}
                />
                <p className={styles.description}>{optionDescription}</p>
            </div>
            {
                toolChangeOption === 'Fixed Tool Sensor' && (
                    <div>
                        <Input
                            label="Tool Length Sensor X position"
                            units=""
                            value={toolChangePosition.x}
                            onChange={(e) => handlePositionChange(e, 'x')}
                        />
                        <Input
                            label="Tool Length Sensor Y position"
                            units=""
                            value={toolChangePosition.y}
                            onChange={(e) => handlePositionChange(e, 'y')}
                        />
                        <Input
                            label="Tool Length Sensor Z position"
                            units=""
                            value={toolChangePosition.z}
                            onChange={(e) => handlePositionChange(e, 'z')}
                        />
                    </div>
                )
            }
        </Fieldset>
    );
};

export default ToolChange;
