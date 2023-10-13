import React, { useContext } from 'react';
import Table from 'app/components/Table';
import Modal from 'app/components/ToolModal/ToolModal';
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
import ToggleSwitch from 'Components/ToggleSwitch';

import { GamepadContext } from './utils/context';
import { setCurrentModal, setGamepadProfileList } from './utils/actions';

import styles from './index.styl';
import generalStyles from '../edit-area.styl';
import { arrayComparator } from './utils';

const SetShortcut = () => {
    const {
        state: { currentProfile, currentButton, settings: { profiles } },
        dispatch,
        actions: { getGamepadProfile },
    } = useContext(GamepadContext);

    const { value: currentButtonValue, type: currentButtonType } = currentButton || {};

    const profile = getGamepadProfile(currentProfile);
    const currentShortcut = profile.buttons?.[currentButtonValue][currentButtonType];

    const closeModal = () => dispatch(setCurrentModal(null));

    const handleSetAction = (shortcut) => {
        const updatedProfiles =
            profiles.map(profile => (arrayComparator(profile.id, currentProfile)
                ? ({
                    ...profile,
                    buttons: profile.buttons.map(button => (button.value === currentButtonValue ? { ...button, [currentButtonType]: shortcut } : button))
                })
                : profile
            ));

        dispatch(setGamepadProfileList(updatedProfiles));
    };

    const handleSet = (type, button, shouldSet) => {
        let payload = {};

        if (type === 'lockout') {
            payload = {
                lockout: {
                    button: shouldSet ? button : null,
                    active: false,
                },
            };
        } else if (type === 'modifier') {
            payload = {
                modifier: {
                    button: shouldSet ? button : null
                }
            };
        }

        const updatedProfiles =
            profiles.map(profile => (arrayComparator(profile.id, currentProfile)
                ? ({
                    ...profile,
                    ...payload,
                })
                : profile
            ));

        dispatch(setGamepadProfileList(updatedProfiles));
    };

    const data = Object.values(shuttleEvents.allShuttleControlEvents)
        .reduce((acc, value) => {
            const hasCategory = acc.find(event => event?.category === value?.category);

            if (hasCategory) {
                acc = acc.map(event => (event?.category === value?.category ? { ...event, actions: [...event.actions, value] } : event));
            } else {
                acc.push({ category: value?.category, actions: [value] });
            }

            return acc;
        }, []);

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
                [COOLANT_CATEGORY]: 'categoryDarkRed'
            };

            const rowCategory = shuttleEvents.allShuttleControlEvents?.[row.cmd]?.category ?? row.category;
            const category = categories[rowCategory];

            return (
                <div className={generalStyles[category]}>{rowCategory}</div>
            );
        },
        actions: (_, row) => {
            return (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {
                        row.actions.map(action => (
                            <button
                                key={action.cmd}
                                type="button"
                                className={action.cmd === currentShortcut ? styles['action-item-active'] : styles['action-item']}
                                onClick={() => handleSetAction(action.cmd)}
                                disabled={action.cmd === currentShortcut}
                            >
                                {action.title}
                            </button>
                        ))
                    }
                </div>
            );
        },
    };

    const columns = [
        { title: 'Category', width: '25%', render: render.category },
        { title: 'Actions', width: '75%', render: render.actions },
    ];

    const currentShortcutTitle = shuttleEvents.allShuttleControlEvents[currentShortcut]?.title ?? currentShortcut;
    const buttonLabel = profile?.buttons?.[currentButtonValue]?.label;

    const isLockoutButton = currentButtonValue === profile.lockout?.button;
    const isSecondaryActionButton = currentButtonValue === profile.modifier?.button;

    return (
        <Modal onClose={closeModal} size="md" title="Set Gamepad Profile Shortcut">
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '4fr 1fr', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        {(isLockoutButton || isSecondaryActionButton) && <div className={styles['disabled-overlay']} />}

                        <Table
                            useFixedHeader
                            columns={columns}
                            data={data}
                            width={650}
                            height={358}
                        />
                    </div>

                    <div style={{ fontSize: '1rem' }}>
                        <div style={{ margin: '2rem 0' }}>
                            <p>Use As Lockout Button</p>
                            <ToggleSwitch
                                checked={isLockoutButton}
                                onChange={(checked) => handleSet('lockout', currentButtonValue, checked)}
                            />
                        </div>

                        <div>
                            <p>Use As Activate Second Action Button</p>
                            <ToggleSwitch
                                checked={isSecondaryActionButton}
                                onChange={(checked) => handleSet('modifier', currentButtonValue, checked)}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ width: '100%', display: 'flex', gap: '3rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div>Shortcut:</div>
                        <kbd>{buttonLabel}</kbd>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div>Action:</div>
                        <div className={styles['action-item-active']}>
                            {currentShortcutTitle ?? '...'}
                        </div>
                    </div>
                </div>

            </div>
        </Modal>
    );
};

export default SetShortcut;
