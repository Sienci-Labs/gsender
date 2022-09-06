import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import map from 'lodash/map';
import store from 'app/store';
import controller from 'app/lib/controller';


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
    // Handlers
    const handleToolChange = (selection) => setToolChangeOption(selection.value);

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
                        value: option.label,
                        label: option.label
                    }))}
                    value={{ label: toolChangeOption }}
                />
            </div>
        </Fieldset>
    );
};

export default ToolChange;
