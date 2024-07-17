import styled from 'styled-components';

import ControlledNumberInput from 'app/components/ControlledNumberInput';

export const MultiInputBlockContainer = styled.div`
  display: grid;
  grid-template-columns: ${(props) => (props.hasDivider ? '4fr 1fr 5fr' : '1fr 1fr')};
  align-items: center;
  margin-bottom: 1rem;
`;

export const Divider = styled.span`
    text-align: center;
    font-size: 1.5rem;
`;

export const InputWrapper = styled.div`
  display: grid;    
  gap: 1rem;
  grid-template-columns: 1fr 2fr;
  align-items: center;
`;

export const InputStyled = styled(ControlledNumberInput)`
  font-size: 1.35rem !important;
  z-index: 0 !important; 
  text-align: center;
  color: #3e85c7;
  padding-left: 5px;
  padding-right: 5px;
`;

export const InputWrapperStyled = styled.div`
  display: grid;
  gap: 1rem;
  ${(props) => (props.hasTwoColumns && 'grid-template-columns: 1fr 2fr; margin-bottom: 1rem;')}
`;

export const InputLabelStyled = styled.label`
    font-size: 1.1rem;
    align-self: center;
`;
