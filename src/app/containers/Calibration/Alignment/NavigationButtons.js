import React from 'react';

import FunctionButton from 'app/components/FunctionButton/FunctionButton';

const NavigationButtons = ({ onNext, onPrevious, nextDisabled, prevDisabled, onShowJogControls }) => {
    return (
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <FunctionButton primary onClick={onPrevious} disabled={!prevDisabled}>Previous</FunctionButton>
                <FunctionButton primary onClick={onNext} disabled={!nextDisabled}>Next</FunctionButton>
            </div>
            <FunctionButton onClick={onShowJogControls}>Show Jog Controls</FunctionButton>
        </div>
    );
};

export default NavigationButtons;
