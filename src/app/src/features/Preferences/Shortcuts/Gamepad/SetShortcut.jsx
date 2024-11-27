import React, { useState, useContext } from 'react';
import { Table } from 'app/components/Table';
import Modal from 'app/components/ToolModal';
import {
    CARVING_CATEGORY,
    OVERRIDES_CATEGORY,
    VISUALIZER_CATEGORY,
    LOCATION_CATEGORY,
    JOGGING_CATEGORY,
    PROBING_CATEGORY,
    SPINDLE_LASER_CATEGORY,
    GENERAL_CATEGORY,
    TOOLBAR_CATEGORY,
    MACRO_CATEGORY,
    COOLANT_CATEGORY,
} from 'app/constants';
import shuttleEvents from 'app/lib/shuttleEvents';
import { Toaster, TOASTER_INFO } from 'app/lib/toaster/ToasterLib';
import ToggleSwitch from 'app/components/Switch';
import { Button } from 'app/components/Button';

import { GamepadContext } from './utils/context';
import { setCurrentModal, setGamepadProfileList } from './utils/actions';

import styles from './index.module.styl';
import generalStyles from '../edit-area.module.styl';
import { arrayComparator } from './utils';
import { toast } from 'app/lib/toaster';

const SetShortcut = () => {
    const {
        state: {
            currentProfile,
            currentButton,
            settings: { profiles },
        },
        dispatch,
        actions: { getGamepadProfile, getMacros },
    } = useContext(GamepadContext);
    const [isChanged, setIsChanged] = useState(false);

    const { value: currentButtonValue, type: currentButtonType } =
        currentButton || {};

    const macros = getMacros();
    const profile = getGamepadProfile(currentProfile);
    const currentShortcut =
        profile.buttons?.[currentButtonValue][currentButtonType];

    const closeModal = () => dispatch(setCurrentModal(null));

    const handleSetAction = (shortcut) => {
        const updatedProfiles = profiles.map((profile) =>
            arrayComparator(profile.id, currentProfile)
                ? {
                      ...profile,
                      buttons: profile.buttons.map((button) =>
                          button.value === currentButtonValue
                              ? { ...button, [currentButtonType]: shortcut }
                              : button,
                      ),
                  }
                : profile,
        );

        dispatch(setGamepadProfileList(updatedProfiles));

        setIsChanged(true);
    };

    const handleSetToggle = (type, button, shouldSet) => {
        let payload = {};

        if (type === 'lockout') {
            payload = {
                lockout: {
                    button: shouldSet ? button : null,
                },
            };

            if (profile.modifier.button === button) {
                payload.modifier = { button: null };
            }
        } else if (type === 'modifier') {
            payload = {
                modifier: {
                    button: shouldSet ? button : null,
                },
            };

            if (profile.lockout.button === button) {
                payload.lockout = { button: null };
            }
        }

        const updatedProfiles = profiles.map((profile) =>
            arrayComparator(profile.id, currentProfile)
                ? {
                      ...profile,
                      ...payload,
                  }
                : profile,
        );

        dispatch(setGamepadProfileList(updatedProfiles));

        setIsChanged(true);
    };

    const onSetClick = () => {
        closeModal();

        toast.success('Button Shortcut Set');
    };

    const getData = () => {
        let allEvents = { ...macros, ...shuttleEvents.allShuttleControlEvents };
        delete allEvents.MACRO;
        delete allEvents.STOP_CONT_JOG;

        const data = Object.values(allEvents).reduce((acc, value) => {
            const hasCategory = acc.find(
                (event) => event?.category === value?.category,
            );

            if (hasCategory) {
                acc = acc.map((event) =>
                    event?.category === value?.category
                        ? { ...event, actions: [...event.actions, value] }
                        : event,
                );
            } else {
                acc.push({ category: value?.category, actions: [value] });
            }

            return acc;
        }, []);

        return data;
    };

    const render = {
        category: (_, row) => {
            const categories = {
                [CARVING_CATEGORY]: 'categoryGreen',
                [OVERRIDES_CATEGORY]: 'categoryBlue',
                [VISUALIZER_CATEGORY]: 'categoryPink',
                [LOCATION_CATEGORY]: 'categoryOrange',
                [JOGGING_CATEGORY]: 'categoryRed',
                [PROBING_CATEGORY]: 'categoryPurple',
                [SPINDLE_LASER_CATEGORY]: 'categoryBlack',
                [GENERAL_CATEGORY]: 'categoryGrey',
                [TOOLBAR_CATEGORY]: 'categoryShipCove',
                [MACRO_CATEGORY]: 'categoryLightBlue',
                [COOLANT_CATEGORY]: 'categoryDarkRed',
            };

            const rowCategory =
                shuttleEvents.allShuttleControlEvents?.[row.cmd]?.category ??
                row.category;
            const category = categories[rowCategory];

            return <div className={generalStyles[category]}>{rowCategory}</div>;
        },
        actions: (_, row) => {
            return (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {row.actions.map((action) => (
                        <button
                            key={action.cmd}
                            type="button"
                            className={
                                action.cmd === currentShortcut
                                    ? styles['action-item-active']
                                    : styles['action-item']
                            }
                            onClick={() => handleSetAction(action.cmd)}
                            disabled={action.cmd === currentShortcut}
                        >
                            {action.title}
                        </button>
                    ))}
                </div>
            );
        },
    };

    const columns = [
        { title: 'Category', width: '25%', render: render.category },
        { title: 'Actions', width: '75%', render: render.actions },
    ];
    const data = getData();

    const currentShortcutTitle =
        shuttleEvents.allShuttleControlEvents[currentShortcut]?.title ||
        macros.find((el) => el.cmd === currentShortcut)?.title ||
        currentShortcut;
    const buttonLabel = profile?.buttons?.[currentButtonValue]?.label;

    const isLockoutButton = currentButtonValue === profile.lockout?.button;
    const isSecondaryActionButton =
        currentButtonValue === profile.modifier?.button;

    const lockoutLabel = isLockoutButton ? 'Lockout Button' : null;
    const secondaryActionLabel = isSecondaryActionButton
        ? 'Activate Secondary Action Button'
        : null;

    return (
        <Modal
            onClose={closeModal}
            size="md"
            title="Set Gamepad Profile Shortcut"
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '4fr 1fr',
                        gap: '1rem',
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        {(isLockoutButton || isSecondaryActionButton) && (
                            <div className={styles['disabled-overlay']} />
                        )}

                        <Table
                            useFixedHeader
                            columns={columns}
                            data={data}
                            width={650}
                            height={365}
                        />
                    </div>

                    <div style={{ fontSize: '1rem' }}>
                        <div style={{ margin: '2rem 0' }}>
                            <p>Use As Lockout Button</p>
                            <ToggleSwitch
                                checked={isLockoutButton}
                                onChange={(checked) =>
                                    handleSetToggle(
                                        'lockout',
                                        currentButtonValue,
                                        checked,
                                    )
                                }
                            />
                        </div>

                        <div>
                            <p>Use As Enable Second Action Button</p>
                            <ToggleSwitch
                                checked={isSecondaryActionButton}
                                onChange={(checked) =>
                                    handleSetToggle(
                                        'modifier',
                                        currentButtonValue,
                                        checked,
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        width: '100%',
                        display: 'flex',
                        gap: '3rem',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                        }}
                    >
                        <div>Shortcut:</div>
                        <kbd>{buttonLabel}</kbd>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                        }}
                    >
                        <div>Action:</div>
                        <div className={styles['action-item-active']}>
                            {lockoutLabel ||
                                secondaryActionLabel ||
                                currentShortcutTitle ||
                                '...'}
                        </div>
                    </div>

                    <Button
                        primary
                        onClick={onSetClick}
                        style={{ margin: 0, maxWidth: '200px' }}
                        disabled={!isChanged}
                    >
                        Set Shortcut
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default SetShortcut;
