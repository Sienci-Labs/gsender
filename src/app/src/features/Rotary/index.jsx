import React from 'react';
import classNames from 'classnames';

import Widget from 'app/components/Widget';

import Rotary from './Rotary';
import { RotaryContextProvider } from './Context';

const RotaryWidget = ({ active }) => {
    return (
        <Widget>
            <RotaryContextProvider>
                <Rotary />
            </RotaryContextProvider>
        </Widget>
    );
};

export default RotaryWidget;
