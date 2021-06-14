import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FunctionButton from 'app/components/FunctionButton/FunctionButton';

import styles from './index.styl';

const ActionItem = ({ checked, onChange, id, isCurrentAction, hasBeenChanged, label: Label, hideCompleteButton }) => {
    return (
        <div className={(isCurrentAction || hasBeenChanged) ? styles.action : styles.actionInactive}>
            {
                isCurrentAction
                    ? <i className={classnames('fas fa-arrow-circle-right', styles.currentActionItem)} />
                    : (
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => onChange({ id, checked: e.target.checked })}
                            style={{ width: '20px', height: '20px', margin: 0 }}
                            disabled={!(isCurrentAction || hasBeenChanged)}
                        />
                    )
            }

            {
                !hideCompleteButton && (
                    <FunctionButton
                        primary
                        style={{ margin: 0, width: '100px' }}
                        disabled={(!isCurrentAction || hasBeenChanged)}
                        onClick={() => onChange({ id, checked: true })}
                    >
                        Complete
                    </FunctionButton>
                )
            }

            <Label isCurrentAction={isCurrentAction} onChange={({ axis, value }) => onChange({ id, checked: true, axis, value })} />
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
    showCompleteButton: PropTypes.bool,
};

export default ActionItem;
