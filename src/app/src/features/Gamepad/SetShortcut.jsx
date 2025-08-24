import { useState, useContext } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from 'app/components/shadcn/Dialog';
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
import { Switch } from 'app/components/shadcn/Switch';
import Button from 'app/components/Button';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from 'app/components/shadcn/Table';
import { cn } from 'app/lib/utils';

import { GamepadContext } from './utils/context';
import { setCurrentModal, setGamepadProfileList } from './utils/actions';
import { arrayComparator } from './utils';

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
    const [currentShortcut, setCurrentShortcut] = useState(
        profile.buttons?.[currentButtonValue][currentButtonType],
    );

    const closeModal = () => {
        dispatch(setCurrentModal(null));
    };

    const handleOpenChange = (open) => {
        if (!open) {
            closeModal();
        }
    };

    const handleSetAction = () => {
        const updatedProfiles = profiles.map((profile) =>
            arrayComparator(profile.id, currentProfile)
                ? {
                      ...profile,
                      buttons: profile.buttons.map((button) =>
                          button.value === currentButtonValue
                              ? {
                                    ...button,
                                    [currentButtonType]: currentShortcut,
                                }
                              : button,
                      ),
                  }
                : profile,
        );

        dispatch(setGamepadProfileList(updatedProfiles));

        closeModal();

        Toaster.pop({
            msg: 'Button Shortcut Set',
            type: TOASTER_INFO,
            duration: 3000,
        });
    };

    const handleActionPress = (action) => {
        if (currentShortcut === action) return;

        setCurrentShortcut(action);
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

        const categoryOrder = [
            JOGGING_CATEGORY,
            LOCATION_CATEGORY,
            MACRO_CATEGORY,
            PROBING_CATEGORY,
            SPINDLE_LASER_CATEGORY,
            COOLANT_CATEGORY,
            CARVING_CATEGORY,
            OVERRIDES_CATEGORY,
            GENERAL_CATEGORY,
            TOOLBAR_CATEGORY,
            VISUALIZER_CATEGORY,
        ];

        data.sort((a, b) => {
            const aIndex = categoryOrder.indexOf(a.category);
            const bIndex = categoryOrder.indexOf(b.category);

            // If categories are different, sort by category order
            if (aIndex !== bIndex) {
                return aIndex - bIndex;
            }

            // If categories are the same, sort alphabetically by category name
            return a.category.localeCompare(b.category);
        });

        return data;
    };

    const render = {
        category: (row) => {
            const baseClass = 'text-white px-2 py-1 rounded text-center';

            const categories = {
                [CARVING_CATEGORY]: 'bg-green-100 text-green-800',
                [OVERRIDES_CATEGORY]: 'bg-blue-100 text-blue-800',
                [VISUALIZER_CATEGORY]: 'bg-pink-100 text-pink-800',
                [LOCATION_CATEGORY]: 'bg-orange-100 text-orange-800',
                [JOGGING_CATEGORY]: 'bg-red-100 text-red-800',
                [PROBING_CATEGORY]: 'bg-purple-100 text-purple-800',
                [SPINDLE_LASER_CATEGORY]: 'bg-gray-700 text-gray-300',
                [GENERAL_CATEGORY]: 'bg-gray-200 text-gray-800',
                [TOOLBAR_CATEGORY]: 'bg-indigo-100 text-indigo-800',
                [MACRO_CATEGORY]: 'bg-blue-50 text-blue-600',
                [COOLANT_CATEGORY]: 'bg-red-200 text-red-900',
            };

            const categoryClass =
                categories[row.category] || 'bg-gray-100 text-gray-800';

            return (
                <div className={cn(baseClass, categoryClass)}>
                    {row.category}
                </div>
            );
        },
        actions: (row) => {
            return (
                <div className="flex gap-4 flex-wrap">
                    {row.actions.map((action) => (
                        <button
                            key={action.cmd}
                            type="button"
                            className={
                                action.cmd === currentShortcut
                                    ? 'bg-blue-500 text-white px-3 py-1 rounded'
                                    : 'bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded dark:bg-dark-lighter'
                            }
                            onClick={() => handleActionPress(action.cmd)}
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
        <Dialog open onOpenChange={handleOpenChange}>
            <DialogContent className="w-3/4 max-w-[1200px]">
                <DialogHeader>
                    <DialogTitle>Set Gamepad Profile Shortcut</DialogTitle>
                </DialogHeader>

                <DialogDescription>
                    Use the gamepad to set the shortcut for the current button.
                </DialogDescription>

                <div className="flex flex-col justify-between items-center gap-4">
                    <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-4 relative">
                            {(isLockoutButton || isSecondaryActionButton) && (
                                <div className="absolute inset-0 bg-gray-200 bg-opacity-50 z-10" />
                            )}

                            <div className="border rounded-md max-h-[600px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-white z-10 dark:bg-dark-lighter">
                                        <TableRow>
                                            {columns.map((column) => (
                                                <TableHead
                                                    key={column.title}
                                                    style={{
                                                        width: column.width,
                                                    }}
                                                >
                                                    {column.title}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {render.category(item)}
                                                </TableCell>
                                                <TableCell>
                                                    {render.actions(item)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="text-base">
                            <div className="my-8">
                                <p>Use as Lockout button</p>
                                <Switch
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
                                <p>Use as 2nd Action button</p>
                                <Switch
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

                    <DialogFooter className="w-full flex gap-12 justify-between items-center">
                        <div className="flex gap-2 items-center">
                            <div>Shortcut:</div>
                            <kbd>{buttonLabel}</kbd>
                        </div>

                        <div className="flex gap-2 items-center">
                            <div>Action:</div>
                            <div className="bg-blue-500 text-white px-3 py-1">
                                {lockoutLabel ||
                                    secondaryActionLabel ||
                                    currentShortcutTitle ||
                                    '...'}
                            </div>
                        </div>

                        <Button onClick={handleSetAction} disabled={!isChanged}>
                            Set Shortcut
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SetShortcut;
