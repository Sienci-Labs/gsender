import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './index.styl';

const ActionItem = ({ checked, onChange, id, isCurrentAction, hasBeenChanged, label: Label }) => {
    return (
        <div className={(isCurrentAction || hasBeenChanged) ? styles.action : styles.actionInactive}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange({ id, checked: e.target.checked })}
                style={{ width: '30px', height: '30px', margin: 0 }}
                disabled={!(isCurrentAction || hasBeenChanged)}
            />

            {
                isCurrentAction
                    ? <i className={classnames('fas fa-arrow-circle-right', styles.currentActionItem)} />
                    : <div />
            }

            <Label isCurrentAction={isCurrentAction} />
        </div>
    );
};

ActionItem.propTypes = {
    checked: PropTypes.bool,
    onChange: PropTypes.func,
    id: PropTypes.number,
    isCurrentAction: PropTypes.bool,
    label: PropTypes.func,
    hasBeenChanged: PropTypes.bool,
};

export default ActionItem;
