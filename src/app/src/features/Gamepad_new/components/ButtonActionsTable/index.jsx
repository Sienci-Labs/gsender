import { useContext } from 'react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

import shuttleEvents from 'app/lib/shuttleEvents';
import { useGamepadListener } from 'app/lib/hooks/useGamepadListener';

import { GamepadContext } from '../../utils/context';
import { arrayComparator } from '../../utils';
import {
    setCurrentGamepadProfileButton,
    setCurrentModal,
    setGamepadProfileList,
} from '../../utils/actions';
import { GAMEPAD_MODAL } from '../../utils/constants';

import { get } from 'lodash';
import classNames from 'classnames';
import { Input } from 'app/components/Input';

const ButtonActionsTable = () => {
    const {
        state: {
            currentProfile,
            settings: { profiles },
        },
        dispatch,
        actions: { getGamepadProfile, getMacros },
    } = useContext(GamepadContext);
    const { buttons } = useGamepadListener({ profile: currentProfile });

    const profile = getGamepadProfile(currentProfile);
    const macros = getMacros();

    const buttonsArr = [...profile.buttons].sort((button) => {
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
        const updatedProfiles = profiles.map((profile) =>
            arrayComparator(profile.id, currentProfile)
                ? {
                      ...profile,
                      buttons: profile.buttons.map((button) =>
                          button.value === currentButtonValue
                              ? { ...button, [actionType]: null }
                              : button,
                      ),
                  }
                : profile,
        );

        dispatch(setGamepadProfileList(updatedProfiles));
    };

    const handleRemoveLockoutButton = () => {
        const updatedProfiles = profiles.map((profile) =>
            arrayComparator(profile.id, currentProfile)
                ? {
                      ...profile,
                      lockout: {
                          button: null,
                          active: false,
                      },
                  }
                : profile,
        );

        dispatch(setGamepadProfileList(updatedProfiles));
    };

    const handleRemoveModifierButton = () => {
        const updatedProfiles = profiles.map((profile) =>
            arrayComparator(profile.id, currentProfile)
                ? {
                      ...profile,
                      modifier: {
                          button: null,
                      },
                  }
                : profile,
        );

        dispatch(setGamepadProfileList(updatedProfiles));
    };

    const handleButtonLabelChange = (currentButtonValue, label) => {
        const updatedProfiles = profiles.map((profile) =>
            arrayComparator(profile.id, currentProfile)
                ? {
                      ...profile,
                      buttons: profile.buttons.map((button) =>
                          button.value === currentButtonValue
                              ? { ...button, label }
                              : button,
                      ),
                  }
                : profile,
        );

        dispatch(setGamepadProfileList(updatedProfiles));
    };

    const render = {
        button: (_, row) => {
            const buttonIsPressed = buttons[row.value]?.pressed;

            if (buttonIsPressed) {
                return (
                    <Input
                        defaultValue={row.label}
                        className="bg-green-500 border-green-500 text-white p-1 w-full rounded dark:bg-dark dark:text-white"
                        onBlur={(e) =>
                            handleButtonLabelChange(row.value, e.target.value)
                        }
                    />
                );
            }

            return (
                <Input
                    defaultValue={row.label}
                    className="bg-white border border-gray-300 p-1 w-full rounded"
                    onBlur={(e) =>
                        handleButtonLabelChange(row.value, e.target.value)
                    }
                />
            );
        },
        action: (action, value, type) => {
            if (!action) {
                return (
                    <div className="flex items-center justify-center p-2 border border-dashed border-gray-300 rounded">
                        <FaPlus
                            role="button"
                            tabIndex={-1}
                            className="text-blue-500 cursor-pointer"
                            onClick={() =>
                                handleOpenSetShortcutModal(value, type)
                            }
                            onKeyDown={() =>
                                handleOpenSetShortcutModal(value, type)
                            }
                        />
                    </div>
                );
            }

            const event =
                shuttleEvents.getEvent(action) ||
                macros.find((el) => el.cmd === action);

            return (
                <div className="flex justify-between items-center p-2 border border-gray-300 rounded dark:border-gray-700">
                    <div className="w-full truncate dark:text-white">
                        {event?.title ?? action}
                    </div>

                    <div className="flex space-x-2">
                        <FaEdit
                            role="button"
                            tabIndex={-1}
                            className="text-blue-500 w-5 cursor-pointer"
                            onClick={() =>
                                handleOpenSetShortcutModal(value, type)
                            }
                            onKeyDown={() =>
                                handleOpenSetShortcutModal(value, type)
                            }
                        />
                        <FaTrash
                            role="button"
                            tabIndex={-1}
                            className="text-red-500 w-5 cursor-pointer"
                            onClick={() =>
                                handleRemoveButtonAction(value, type)
                            }
                            onKeyDown={() =>
                                handleRemoveButtonAction(value, type)
                            }
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
                <div className="flex justify-between items-center p-2">
                    <div>Lockout</div>
                    <FaTrash
                        role="button"
                        tabIndex={-1}
                        className="text-red-500 w-5 cursor-pointer"
                        onClick={() => handleRemoveLockoutButton()}
                        onKeyDown={() => handleRemoveLockoutButton()}
                    />
                </div>
            );
        },
        modifier: (_, row) => {
            return (
                <div className="flex justify-between items-center p-2">
                    <div className="dark:text-white">Activate 2nd Actions</div>
                    <FaTrash
                        role="button"
                        tabIndex={-1}
                        className="text-red-500 w-5 cursor-pointer"
                        onClick={() => handleRemoveModifierButton()}
                        onKeyDown={() => handleRemoveModifierButton()}
                    />
                </div>
            );
        },
    };

    const Action = ({ button = {} }) => {
        const activeStyles = 'bg-green-500 border-green-500 text-white';
        const inactiveStyles = 'bg-gray-200';

        const buttonIsPressed = buttons[button.value]?.pressed;

        const lockoutButton = get(profile, 'lockout.button');
        const modifierButton = get(profile, 'modifier.button');

        const secondActionButtonBeingPressed = buttons.find(
            (button, index) => index === modifierButton && button.pressed,
        );

        if (button.value === lockoutButton) {
            return (
                <td
                    className={`p-2 ${buttonIsPressed ? activeStyles : inactiveStyles}`}
                    colSpan={2}
                >
                    {render.lockout(null, button)}
                </td>
            );
        }

        if (button.value === modifierButton) {
            return (
                <td
                    className={`p-2 ${buttonIsPressed ? activeStyles : inactiveStyles} dark:text-white dark:bg-dark`}
                    colSpan={2}
                >
                    {render.modifier(null, button)}
                </td>
            );
        }

        const highlightPrimaryActionCell =
            button.primaryAction !== null &&
            buttonIsPressed &&
            !secondActionButtonBeingPressed;
        const highlightSecondaryActionCell =
            button.secondaryAction !== null &&
            buttonIsPressed &&
            secondActionButtonBeingPressed;

        return (
            <>
                <td
                    className={classNames(
                        'p-2',
                        highlightPrimaryActionCell
                            ? 'bg-green-500 text-white'
                            : '',
                    )}
                >
                    {render.primaryAction(null, button)}
                </td>

                <td
                    className={classNames(
                        'p-2',
                        highlightSecondaryActionCell
                            ? 'bg-green-500 text-white'
                            : '',
                    )}
                >
                    {render.secondaryAction(null, button)}
                </td>
            </>
        );
    };

    return (
        <table className="w-full border-collapse dark:bg-dark">
            <thead className="dark:text-white">
                <tr>
                    <th
                        className="text-left p-2 bg-gray-100 border-b border-gray-300 dark:bg-dark dark:text-white"
                        style={{ width: '20%', minWidth: '80px' }}
                    >
                        Button
                    </th>
                    <th
                        className="text-left p-2 bg-gray-100 border-b border-gray-300 dark:bg-dark dark:text-white"
                        style={{ width: '40%' }}
                    >
                        Action
                    </th>
                    <th
                        className="text-left p-2 bg-gray-100 border-b border-gray-300 dark:bg-dark dark:text-white"
                        style={{ width: '40%' }}
                    >
                        2nd Action
                    </th>
                </tr>
            </thead>

            <tbody>
                {buttonsArr.map((button) => (
                    <tr
                        key={button.value}
                        className="border-b border-gray-200 dark:border-gray-700"
                    >
                        <td className="p-2">{render.button(null, button)}</td>

                        <Action button={button} />
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ButtonActionsTable;
