import React from 'react';
import classNames from 'classnames';
import styles from '../index.styl';

const Probe = ({ id, xyThickness, zThickness, functions, handleDelete }) => {
    return (
        <div className={styles.tool}>
            <div className={styles.probeInfo}>
                <b>{ id }</b>
                {
                    (functions.x || functions.y) && (
                        <div className={classNames('small', styles.inputSpread)}>
                            <b>XY Thickness:</b>
                            {xyThickness}mm
                        </div>
                    )
                }
                {
                    functions.z && (
                        <div className={classNames('small', styles.inputSpread)}>
                            <b>Z Thickness:</b>
                            {zThickness}mm
                        </div>
                    )
                }
            </div>
            <button
                type="button"
                className={styles.delete}
                alt="Delete Probe Profile"
                onClick={handleDelete}
            >
                <i className="fa fa-minus" />
            </button>
        </div>
    );
};

export default Probe;
