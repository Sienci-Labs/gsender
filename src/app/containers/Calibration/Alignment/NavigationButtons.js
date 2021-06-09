import React from 'react';

import FunctionButton from 'app/components/FunctionButton/FunctionButton';

const NavigationButtons = ({ onNext, onPrevious, nextDisabled, prevDisabled }) => {
    return (
        <div style={{ display: 'flex', gap: '1rem' }}>
            <FunctionButton primary onClick={onPrevious} disabled={!prevDisabled}>Previous</FunctionButton>
            <FunctionButton primary onClick={onNext} disabled={!nextDisabled}>Next</FunctionButton>
        </div>
    );
};

export default NavigationButtons;
