import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import PropTypes from 'prop-types';

import store from 'app/store';
import ToolModal from 'app/components/ToolModal/ToolModal';
import Button from 'app/components/FunctionButton/FunctionButton';
import styles from './index.styl';

const AddActionModal = ({ onClose }) => {
    const [commands, setCommands] = useState([]);

    useEffect(() => {
        const commands = store.get('commandKeys');

        setCommands(commands);
    }, []);

    return (
        <ToolModal onClose={onClose} size="small" title="Add Action to Profile">
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

AddActionModal.propTypes = { onClose: PropTypes.func };

export default AddActionModal;
