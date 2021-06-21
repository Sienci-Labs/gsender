import React, { useState, useEffect } from 'react';
import Select from 'react-select';

import store from 'app/store';
import ToolModal from 'app/components/ToolModal/ToolModal';
import Button from 'app/components/FunctionButton/FunctionButton';
import styles from './index.styl';

const AddActionModal = ({ onClose }) => {
    const [commands, setCommands] = useState([]);
    // const [shortcut, setShortcut] = useState(null);

    useEffect(() => {
        const commands = store.get('commandKeys');

        setCommands(commands);
    }, []);

    return (
        <ToolModal onClose={onClose} size="medium" title="Add Action to Profile" style={{ height: '500px' }}>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <p>Select an Action</p>
                <div className={styles.addActionItem}>
                    <i className="fas fa-play" /> <Select options={commands.map(command => ({ value: command.id, label: command.title }))} isClearable />
                </div>

                <Button primary>Add New Action</Button>
            </div>
        </ToolModal>
    );
};

export default AddActionModal;
