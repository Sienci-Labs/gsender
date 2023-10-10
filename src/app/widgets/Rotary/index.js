import React from 'react';
import classNames from 'classnames';

import Widget from 'app/components/Widget';

import styles from './index.styl';
import Rotary from './Rotary';
import { RotaryContextProvider } from './Context';

const RotaryWidget = ({ active }) => {
    return (
        <Widget>
            <Widget.Content
                active={active}
                className={classNames(
                    styles['widget-content'],
                    styles.heightOverride,
                )}
            >
                <RotaryContextProvider>
                    <Rotary />
                </RotaryContextProvider>
            </Widget.Content>
        </Widget>
    );
};

export default RotaryWidget;
