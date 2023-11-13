import React from 'react';
import Modal from 'app/components/Modal';
import style from './index.styl';

const HalFlashModal = ({ onClose }) => {
    return (
        <Modal onClose={onClose}>
            <div className={style.wrapper}>
                <label for="firmware_image">Choose a hex file</label>
                <input type="file" id="firmware_image" accept=".hex"/>
            </div>
        </Modal>
    );
};

export default HalFlashModal;
