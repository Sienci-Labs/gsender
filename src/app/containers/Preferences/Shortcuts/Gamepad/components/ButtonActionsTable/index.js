import React, { useContext } from 'react';

import shuttleEvents from 'app/lib/shuttleEvents';

import { GamepadContext } from '../../utils/context';
import { arrayComparator } from '../../utils';
import { useGamepadListener } from '../../../../../../lib/hooks/useGamepadListener';
import { setCurrentGamepadProfileButton, setCurrentModal, setGamepadProfileList } from '../../utils/actions';
import { GAMEPAD_MODAL } from '../../utils/constants';

import styles from './index.styl';
import { get } from 'lodash';
import classNames from 'classnames';

const ButtonActionsTable = () => {
    const { state: { currentProfile, settings: { profiles } }, dispatch, actions: { getGamepadProfile } } = useContext(GamepadContext);
    const { buttons } = useGamepadListener({ profile: currentProfile });

    const profile = getGamepadProfile(currentProfile);

    const buttonsArr = [...profile.buttons]
        .sort(button => {
            if (button?.value === profile.modifier?.button) {
                return -1;
            }

            if (button?.value === profile.lockout?.button) {
                return -1;
            }

            return 1;
        });

    const handleOpenSetShortcutModal = (button, type) => {
        dispatch(setCurrentModal(GAMEPAD_MODAL.ADD_ACTION_TO_SHORTCUT));
        dispatch(setCurrentGamepadProfileButton({ value: button, type }));
    };

    const handleRemoveButtonAction = (currentButtonValue, actionType) => {
        const updatedProfiles =
            profiles.map(profile => (arrayComparator(profile.id, currentProfile)
                ? ({
                    ...profile,
                    buttons: profile.buttons.map(button => (button.value === currentButtonValue ? { ...button, [actionType]: null } : button))
                })
                : profile
            ));

        dispatch(setGamepadProfileList(updatedProfiles));
    };

    const handleRemoveLockoutButton = () => {
        const updatedProfiles =
            profiles.map(profile => (arrayComparator(profile.id, currentProfile)
                ? ({
                    ...profile,
                    lockout: {
                        button: null,
                        active: false,
                    },
                })
                : profile
            ));

        dispatch(setGamepadProfileList(updatedProfiles));
    };

    const handleRemoveModifierButton = () => {
        const updatedProfiles =
            profiles.map(profile => (arrayComparator(profile.id, currentProfile)
                ? ({
                    ...profile,
                    modifier: {
                        button: null,
                    },
                })
                : profile
            ));

        dispatch(setGamepadProfileList(updatedProfiles));
    };

    const render = {
        button: (_, row) => {
            const buttonIsPressed = buttons[row.value]?.pressed;

            if (buttonIsPressed) {
                return <input defaultValue={row.label} className={styles['button-render-active']} />;
            }

            return <input defaultValue={row.label} className={styles['button-render']} />;
        },
        action: (action, value, type) => {
            if (!action) {
                return (
                    <div className={styles['shortcut-item-empty']}>
                        <i
                            role="button"
                            tabIndex={-1}
                            className="fas fa-plus"
                            style={{ color: 'blue' }}
                            onClick={() => handleOpenSetShortcutModal(value, type)}
                            onKeyDown={() => handleOpenSetShortcutModal(value, type)}
                        />
                    </div>
                );
            }

            const event = shuttleEvents.getEvent(action);

            return (
                <div className={styles['shortcut-item']}>
                    <div style={{ width: '100%' }}>{event?.title ?? action}</div>

                    <div className={styles['shortcut-item-actions']}>
                        <i
                            role="button"
                            tabIndex={-1}
                            className="fas fa-edit"
                            style={{ color: 'blue', width: '20px' }}
                            onClick={() => handleOpenSetShortcutModal(value, type)}
                            onKeyDown={() => handleOpenSetShortcutModal(value, type)}
                        />
                        <i
                            role="button"
                            tabIndex={-1}
                            className="fas fa-trash"
                            style={{ color: 'red', width: '20px' }}
                            onClick={() => handleRemoveButtonAction(value, type)}
                            onKeyDown={() => handleRemoveButtonAction(value, type)}
                        />
                    </div>
                </div>
            );
        },
        primaryAction: (_, row) => {
            const { primaryAction, value } = row;

            return render.action(primaryAction, value, 'primaryAction');
        },
        secondaryAction: (_, row) => {
            const { secondaryAction, value } = row;

            return render.action(secondaryAction, value, 'secondaryAction');
        },
        lockout: (_, row) => {
            return (
                <div className={styles['lockout-modifier']}>
                    <div>Lockout</div>
                    <i
                        role="button"
                        tabIndex={-1}
                        className="fas fa-trash"
                        style={{ color: 'red', width: '20px' }}
                        onClick={() => handleRemoveLockoutButton()}
                        onKeyDown={() => handleRemoveLockoutButton()}
                    />
                </div>
            );
        },
        modifier: (_, row) => {
            return (
                <div className={styles['lockout-modifier']}>
                    <div>Activate 2nd Actions</div>
                    <i
                        role="button"
                        tabIndex={-1}
                        className="fas fa-trash"
                        style={{ color: 'red', width: '20px' }}
                        onClick={() => handleRemoveModifierButton()}
                        onKeyDown={() => handleRemoveModifierButton()}
                    />
                </div>
            );
        }
    };

    const Action = ({ button = {} }) => {
        const activeStyles = {
            backgroundColor: 'rgb(75, 181, 67)',
            borderColor: 'rgb(75, 181, 67)',
            color: 'white'
        };

        const inactiveStyles = {
            backgroundColor: 'lightgrey'
        };

        const buttonIsPressed = buttons[button.value]?.pressed;

        const lockoutButton = get(profile, 'lockout.button');
        const modifierButton = get(profile, 'modifier.button');

        const secondActionButtonBeingPressed = buttons.find((button, index) => index === modifierButton && button.pressed);

        if (button.value === lockoutButton) {
            return (
                <td className={styles.tableCell} colSpan={2} style={buttonIsPressed ? activeStyles : inactiveStyles}>
                    {render.lockout(null, button)}
                </td>
            );
        }

        if (button.value === modifierButton) {
            return (
                <td className={styles.tableCell} colSpan={2} style={buttonIsPressed ? activeStyles : inactiveStyles}>
                    {render.modifier(null, button)}
                </td>
            );
        }

        const highlightPrimaryActionCell = button.primaryAction !== null && buttonIsPressed && !secondActionButtonBeingPressed;
        const highlightSecondaryActionCell = button.secondaryAction !== null && buttonIsPressed && secondActionButtonBeingPressed;

        return (
            <>
                <td className={classNames(styles.tableCell, highlightPrimaryActionCell ? styles.active : '')}>
                    {render.primaryAction(null, button)}
                </td>

                <td className={classNames(styles.tableCell, highlightSecondaryActionCell ? styles.active : '')}>
                    {render.secondaryAction(null, button)}
                </td>
            </>
        );
    };

    return (
        <table>
            <thead>
                <tr>
                    <th className={styles.tableHeader} style={{ width: '20%', minWidth: '80px' }}>Button</th>
                    <th className={styles.tableHeader} style={{ width: '40%' }}>Action</th>
                    <th className={styles.tableHeader} style={{ width: '40%' }}>2nd Action</th>
                </tr>
            </thead>

            <tbody>
                {
                    buttonsArr.map(button => (
                        <tr key={button.value}>
                            <td className={styles.tableCell}>
                                {render.button(null, button)}
                            </td>

                            <Action button={button} />
                        </tr>
                    ))
                }
            </tbody>
        </table>
    );
};

export default ButtonActionsTable;
