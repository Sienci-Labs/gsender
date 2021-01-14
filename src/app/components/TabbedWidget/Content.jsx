import classNames from 'classnames';
import React from 'react';
import widgetStyles from '../Widget/index.styl';

const Content = ({ className, ...props }) => (
    <div
        {...props}
        className={classNames(className, widgetStyles.widgetContent)}
    />
);

export default Content;
