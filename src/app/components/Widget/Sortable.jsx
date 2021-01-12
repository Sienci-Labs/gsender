import classNames from 'classnames';
import React from 'react';
import styles from './index.styl';

const Sortable = (props) => {
    const { className, style } = props;

    return (
        <div className={classNames(className, styles.widgetSortable)} style={style}>
        </div>
    );
};

export default Sortable;
