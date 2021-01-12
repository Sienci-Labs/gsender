import React from 'react';
import PropTypes from 'prop-types';
import i18n from 'app/lib/i18n';

import styles from './IdleInfo.styl';

/**
 * Idle Information component displaying job information when status is set to idle
 * @param {Object} state Default state given from parent component
 */
const IdleInfo = ({ state }) => {
    const { bbox: { min, max, delta }, units } = state;

    return (
        <div className={styles['idle-info']}>
            <table>
                <thead>
                    <tr>
                        <th>{i18n._('Axis')}</th>
                        <th>{i18n._('Min')}</th>
                        <th>{i18n._('Max')}</th>
                        <th>{i18n._('Dimension')}</th>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td className={styles['axis-letter']}>X</td>
                        <td>{`${min.x} ${units}`}</td>
                        <td>{`${max.x} ${units}`}</td>
                        <td>{`${delta.x} ${units}`}</td>
                    </tr>

                    <tr>
                        <td className={styles['axis-letter']}>Y</td>
                        <td>{`${min.y} ${units}`}</td>
                        <td>{`${max.y} ${units}`}</td>
                        <td>{`${delta.y} ${units}`}</td>
                    </tr>

                    <tr>
                        <td className={styles['axis-letter']}>Z</td>
                        <td>{`${min.z} ${units}`}</td>
                        <td>{`${max.z} ${units}`}</td>
                        <td>{`${delta.z} ${units}`}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

IdleInfo.propTypes = {
    state: PropTypes.object,
    actions: PropTypes.object,
};

export default IdleInfo;
