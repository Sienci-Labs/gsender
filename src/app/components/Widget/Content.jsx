import classNames from 'classnames';
import React, { forwardRef } from 'react';
import styles from './index.styl';

const Content = ({ className, active, ...props }) => (
    <div
        {...props}
        className={classNames(className, styles.widgetContent)}
    />
);

export default forwardRef((props, ref) => <Content {...props} reference={ref} />);
