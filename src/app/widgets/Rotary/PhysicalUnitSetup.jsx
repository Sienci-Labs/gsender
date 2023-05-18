import React from 'react';
import Modal from 'app/components/ToolModal/ToolModal';

export default function PhysicalUnitSetup({ physicalUnitState, setPhysicalUnitState }) {
    const { showDialogue } = physicalUnitState;
    const handleModalClose = () => {
        setPhysicalUnitState((prev) => ({ ...prev, showDialogue: false }));
    };
    return (
        <Modal
            title="Physical Rotary-unit Setup" show={showDialogue} onClose={handleModalClose}
            size="lg"
        >
            hi
        </Modal>
    );
}
