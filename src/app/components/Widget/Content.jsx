import classNames from 'classnames';
import React from 'react';
import styles from './index.styl';

const Content = ({ className, active, ...props }) => (
    <div
        {...props}
        className={classNames(className, styles.widgetContent)}
    />
);

export default Content;
