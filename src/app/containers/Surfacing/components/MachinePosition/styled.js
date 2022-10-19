import React from 'react';
import styled from 'styled-components';

import ShowTooltip from '../ShowTooltip';

export const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const Box = styled.div`
  width: 75px;
  height: 75px;
  border: 5px solid black;
  position: relative;
`;

export const SurfacingTypesWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: space-between;
`;

export const SurfacingTypeWrapper = styled.i`
    fill: black;
    padding: 1rem;
    width: 75px;
    height: 75px;
    border: 3px solid black;
    border-radius: 10px;
    transition: all 400ms ease-in-out;

    &:hover {
        cursor: pointer;
        background-color: gray;
        fill: white;
    }
`;

export const Radio = styled.div`
    margin: 0 !important;
    transform: scale(2);
    position: absolute !important; 
    
    i::before {
        margin-left: 0 !important;
        margin-right: 0 !important;
    }

    ${(props) => props.topLeft && 'left: -10px; top: -13px;'}
    ${(props) => props.topRight && 'right: -10px; top: -13px;'}
    ${(props) => props.bottomLeft && 'bottom: -13px; left: -10px;'}
    ${(props) => props.bottomRight && 'bottom: -13px; right: -10px;'}
    ${(props) => props.center && 'top: 35%; left: 40%;'}
`;

export const SurfacingType = ({ tooltip, icon: Icon, value, onClick }) => {
    return (
        <ShowTooltip tooltip={tooltip}>
            <Icon />
            <SurfacingTypeWrapper />
        </ShowTooltip>
    );
};
