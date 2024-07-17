import React from 'react';

import { MultiInputBlockContainer, Divider, InputWrapper, InputLabelStyled } from './styled';

const MultiInputBlock = ({ label, firstComponent, secondComponent, divider }) => {
    return (
        <InputWrapper>
            {label && <InputLabelStyled>{label}</InputLabelStyled>}

            <MultiInputBlockContainer hasDivider={!!divider}>
                {firstComponent}

                {divider && typeof divider === 'string' ? <Divider>{divider}</Divider> : divider}

                {secondComponent}
            </MultiInputBlockContainer>
        </InputWrapper>
    );
};

export default MultiInputBlock;
