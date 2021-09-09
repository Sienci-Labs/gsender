import React from 'react';
import styled from 'styled-components';

// https://codepen.io/dcode-software/pen/zYGVXyX

const GaugeContainer = styled.div`
  width: 100%;
  max-width: 500px;
  font-size: 2.15rem;
  color: #3e85c7;
  padding: 5px 5px 0 5px;
`;

const GaugeBody = styled.div`
  width: 100%;
  height: 0;
  padding-bottom: 50%;
  background: #b4c0be;
  position: relative;
  border-top-left-radius: 100% 200%;
  border-top-right-radius: 100% 200%;
  overflow: hidden;
`;

const GaugeFill = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: inherit;
  height: 100%;
  background: ${props => props.color || '#009578'};
  transform-origin: center top;
  transform: rotate(${props => props.value / 2}turn);
  transition: transform 0.2s ease-out;
`;

const GaugeCover = styled.div`
  width: 75%;
  height: 150%;
  background: ${(props) => props.background || '#e5e7eb'};
  border-radius: 50%;
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%);

  /* Text */
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 25%;
  box-sizing: border-box;
`;

const GaugeChart = ({ value, color, background }) => {
    return (
        <GaugeContainer>
            <GaugeBody>
                <GaugeFill color={color} value={value / 100} />
                <GaugeCover background={background}>
                    {value && `${value}%`}
                </GaugeCover>
            </GaugeBody>
        </GaugeContainer>
    );
};

export default GaugeChart;
